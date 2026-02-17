// ✅ IMPORTAÇÕES CORRETAS - Use SDK v2 com importação do v1 para HttpsError
const functions = require("firebase-functions"); // SDK v1 para HttpsError
const { onRequest, onCall } = require("firebase-functions/v2/https");
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const Papa = require('papaparse');
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { Client, LocalAuth } = require("whatsapp-web.js");

// --- Firebase Admin & Configuration ---
const admin = require("firebase-admin");
const { setGlobalOptions } = require("firebase-functions/v2");

// --- Third-party Libraries ---
const { MercadoPagoConfig, Preference } = require("mercadopago");
const cors = require("cors")({ origin: true });
const path = require('path');
const os = require('os');
const fs = require('fs');
const sharp = require('sharp');
const axios = require('axios');
const { URLSearchParams } = require('url');

admin.initializeApp();
const db = admin.firestore();
// ✅ Configuração do SDK v2

setGlobalOptions({
    region: "us-central1",
    timeoutSeconds: 300,
    memory: "1GiB",
});

// Objeto para manter as sessões ativas na memória do servidor
const sessions = {};

// --- Secrets and Environment Variables ---

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

const client = new MercadoPagoConfig({ accessToken });

// =======================================================================================
// === 💳 FUNÇÕES DE PAGAMENTO E ASSINATURA (MERCADO PAGO) ===
// =======================================================================================

exports.createPreference = onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }

    const { planId, paymentMethod = 'wallet' } = request.data;

    if (paymentMethod === 'pix') {
        // ✅ Lógica para PIX
        return await createPixPayment(planId, request.auth);
    } else {
        // ✅ Lógica atual para Wallet (cartão/boleto)
        return await createWalletPreference(planId, request.auth);
    }
});

// Função para criar preferência do Wallet (sua lógica atual)
async function createWalletPreference(planId, auth) {
    const { MercadoPagoConfig, Preference } = require("mercadopago");
    const client = new MercadoPagoConfig({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
    });

    const preference = new Preference(client);

    let planDetails;
    if (planId === "pro_1pc") {
        planDetails = { title: "Plano FoodPDV Pro (1 PC)", price: 99.90 };
    } else if (planId === "ultra_network") {
        planDetails = { title: "Plano FoodPDV Ultra (Rede)", price: 149.90 };
    }

    const result = await preference.create({
        body: {
            items: [{
                id: planId,
                title: planDetails.title,
                quantity: 1,
                unit_price: planDetails.price,
                currency_id: "BRL",
            }],
            payer: { email: auth.token.email },
            back_urls: {
                success: "https://zeuspdv.web.app/painel/assinatura/sucesso",
                failure: "https://zeuspdv.web.app/painel/assinatura/falha",
            },
            auto_return: "approved",
            notification_url: `https://us-central1-zeuspdv.cloudfunctions.net/receiveWebhook?secret=${process.env.MERCADOPAGO_WEBHOOK_SECRET}`,
            metadata: { user_id: auth.uid, plan_id: planId },
        },
    });

    return { preferenceId: result.id, paymentMethod: 'wallet' };
}

// Nova função para PIX
async function createPixPayment(planId, auth) {
    const { MercadoPagoConfig, Payment } = require("mercadopago");
    const client = new MercadoPagoConfig({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
    });

    const payment = new Payment(client);

    let amount;
    if (planId === "pro_1pc") {
        amount = 99.90;
    } else if (planId === "ultra_network") {
        amount = 149.90;
    }

    const result = await payment.create({
        body: {
            transaction_amount: amount,
            description: `Assinatura ${planId} - Zeus PDV`,
            payment_method_id: "pix",
            notification_url: `https://us-central1-zeuspdv.cloudfunctions.net/pixWebhook?secret=${process.env.MERCADOPAGO_WEBHOOK_SECRET}`,
            payer: {
                email: auth.token.email,
                first_name: auth.token.name || "Cliente",
                last_name: "Zeus PDV"
            },
            metadata: {
                user_id: auth.uid,
                plan_id: planId,
                type: "subscription"
            }
        }
    });

    // Salva no Firestore para acompanhamento
    const db = admin.firestore();
    await db.collection('pix_payments').doc(result.id.toString()).set({
        user_id: auth.uid,
        amount: amount,
        status: 'pending',
        created_at: new Date(),
        qr_code: result.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: result.point_of_interaction.transaction_data.qr_code_base64,
        copy_paste: result.point_of_interaction.transaction_data.ticket_url
    });

    return {
        paymentMethod: 'pix',
        paymentId: result.id,
        qr_code: result.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: result.point_of_interaction.transaction_data.qr_code_base64,
        copy_paste: result.point_of_interaction.transaction_data.ticket_url
    };
}

// functions/src/index.ts

// ... (suas outras funções e importações devem permanecer no topo)

exports.createExtensionSubscription = onCall({
    enforceAppCheck: true,
}, async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Você precisa estar logado para assinar uma extensão.");
    }
    const { extensionId } = request.data;
    if (!extensionId) {
        throw new functions.https.HttpsError("invalid-argument", "O ID da extensão é obrigatório.");
    }

    const userId = request.auth.uid;
    const db = admin.firestore();

    try {
        const extensionRef = db.collection("extensions").doc(extensionId);
        const extensionDoc = await extensionRef.get();

        if (!extensionDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Extensão não encontrada.");
        }

        const extension = extensionDoc.data();
        if (!extension) {
            throw new functions.https.HttpsError("internal", "Falha ao ler os dados da extensão.");
        }

        const price = extension.promoActive ? extension.promoPrice : extension.priceMonthly;

        if (price <= 0) {
            throw new functions.https.HttpsError("invalid-argument", "Esta função é apenas para extensões pagas.");
        }

        const planIdentifier = `ext_plan_${price.toFixed(2).replace(".", "_")}`;
        let planId = "";

        const planRef = db.collection("mp_subscription_plans").doc(planIdentifier);
        const planDoc = await planRef.get();

        if (planDoc.exists) {
            const planData = planDoc.data();
            if (planData && planData.planId) {
                planId = planData.planId;
            }
        }

        if (!planId) {
            const planResponse = await mercadopago.preapprovalPlan.create({
                reason: `Assinatura da Extensão ${extension.name}`,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: "months",
                    transaction_amount: price,
                    currency_id: "BRL",
                },
                back_url: "https://zeuspdv.web.app/painel/extensoes",
                payment_methods_allowed: {},
            });

            if (planResponse.body.id) {
                planId = planResponse.body.id;
                await planRef.set({
                    planId: planId,
                    price: price,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            } else {
                throw new functions.https.HttpsError("internal", "Falha ao criar o plano de assinatura no Mercado Pago.");
            }
        }

        const userDoc = await db.collection("users").doc(userId).get();
        const user = userDoc.data();
        if (!user) {
            throw new functions.https.HttpsError("not-found", "Usuário não encontrado.");
        }

        const subscriptionResponse = await mercadopago.preapproval.create({
            reason: `Assinatura - Extensão ${extension.name}`,
            preapproval_plan_id: planId,
            payer_email: user.email,
            back_url: "https://zeuspdv.web.app/painel/extensoes",
            external_reference: `${userId}_ext_${extension.featureKey}`,
        });

        if (subscriptionResponse.body.id) {
            return { init_point: subscriptionResponse.body.init_point };
        } else {
            throw new functions.https.HttpsError("internal", "Falha ao criar a preferência de assinatura.");
        }

    } catch (error) {
        // CORREÇÃO: Usando sintaxe JavaScript pura
        functions.logger.error("Erro ao criar assinatura de extensão:", error);

        // Acessamos as propriedades de forma segura
        if (error && error.cause) {
            const errorBody = JSON.stringify(error.cause);
            functions.logger.error("Causa do Erro (Mercado Pago):", errorBody);
            throw new functions.https.HttpsError("internal", `Erro na API do Mercado Pago: ${errorBody}`);
        }

        const errorMessage = error.message || "Ocorreu um erro interno.";
        throw new functions.https.HttpsError("internal", errorMessage);
    }
});

exports.receiveWebhook = onRequest(async (req, res) => {
    if (req.query.secret !== webhookSecret) {
        return res.status(403).send("Acesso negado.");
    }
    if (req.body.type === "payment") {
        const paymentId = req.body.data.id;
        try {
            const paymentResponse = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const payment = paymentResponse.data;

            if (payment.status === "approved") {
                const userId = payment.metadata.user_id;
                const planId = payment.metadata.plan_id;
                await assignPlanToUser(userId, planId, payment.id);
            }
        } catch (error) {
            console.error("Erro no webhook:", error);
            return res.status(500).send("Erro interno.");
        }
    }
    return res.status(200).send("Webhook recebido.");
});

async function assignPlanToUser(userId, planId, paymentId) {
    const userRef = db.collection("users").doc(userId);
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    const subscriptionData = {
        planId: planId,
        status: "active",
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        nextBillingAt: admin.firestore.Timestamp.fromDate(nextBillingDate),
        lastPaymentId: paymentId,
        monthlyOrders: {
            count: 0,
            month: new Date().toISOString().slice(0, 7),
        },
    };
    await userRef.update({ subscription: subscriptionData });
}

/**
 * Busca um token de acesso válido para um usuário do Mercado Livre.
 * Se o token estiver expirado, usa o refresh_token para obter um novo e o atualiza no Firestore.
 * @param {string} businessId O UID do usuário de negócio.
 * @returns {Promise<string>} O access_token válido.
 */
const getValidMeliToken = async (businessId) => {
    const integrationRef = db.doc(`users/${businessId}/integrations/mercadolivre`);
    const doc = await integrationRef.get();

    if (!doc.exists) {
        throw new functions.https.HttpsError('not-found', 'Usuário não conectado ao Mercado Livre.');
    }

    const data = doc.data();
    const now = admin.firestore.Timestamp.now();

    // Se o token ainda for válido por mais de 5 minutos, retorne-o.
    if (data.expiresAt.seconds > now.seconds + 300) {
        return data.accessToken;
    }

    // O token expirou, vamos renová-lo.
    console.log(`Token expirado para ${businessId}. Renovando...`);
    const MELI_APP_ID = process.env.MELI_APP_ID;
    const MELI_CLIENT_SECRET = process.env.MELI_CLIENT_SECRET;

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', MELI_APP_ID);
    params.append('client_secret', MELI_CLIENT_SECRET);
    params.append('refresh_token', data.refreshToken);

    const response = await axios.post('https://api.mercadolibre.com/oauth/token', params);
    const newTokens = response.data;

    // Atualiza os novos tokens no Firestore
    await integrationRef.set({
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token, // O ML pode retornar um novo refresh_token
        expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + (newTokens.expires_in * 1000)),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`Token renovado com sucesso para ${businessId}.`);
    return newTokens.access_token;
};

// A função normalizePhoneNumber permanece a mesma, não precisa mexer nela.
const normalizePhoneNumber = (phone) => {
    if (!phone || typeof phone !== "string") return null;
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) return null;
    if (digits.length === 10) {
        const areaCode = digits.substring(0, 2);
        const number = digits.substring(2);
        return `${areaCode}9${number}`;
    }
    return digits;
};

exports.registerUserAndCustomer = functions.https.onCall(async (data, context) => {
    const { email, password, name, phone, role, businessType, supplierType, supplierSubCategory } = data;

    // 1. Validação robusta e CONDICIONAL
    if (!email || !password || !name || !phone || !role) {
        throw new functions.https.HttpsError("invalid-argument", "Dados essenciais (email, senha, nome, telefone, função) estão faltando.");
    }
    // SÓ VALIDA businessType SE o role for 'business'
    if (role === 'business' && !businessType) {
        throw new functions.https.HttpsError("invalid-argument", "Para negócios, o tipo de negócio é obrigatório.");
    }
    // SÓ VALIDA os campos de fornecedor SE o role for 'supplier'
    if (role === 'supplier' && (!supplierType || !supplierSubCategory)) {
        throw new functions.https.HttpsError("invalid-argument", "Para fornecedores, o tipo e ramo de atividade são obrigatórios.");
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
        throw new functions.https.HttpsError("invalid-argument", "O número de telefone fornecido é inválido.");
    }

    const customersRef = db.collection("globalCustomers");
    const phoneQuery = await customersRef.where("phone", "==", normalizedPhone).limit(1).get();

    let userRecord;
    const isNewGlobalCustomer = phoneQuery.empty;

    if (isNewGlobalCustomer) {
        try {
            userRecord = await admin.auth().createUser({ email, password, displayName: name, phoneNumber: `+55${normalizedPhone}` });
            const newCustomerData = {
                name, phone: normalizedPhone, email, uid: userRecord.uid,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                totalSpent: 0, orderCount: 0, establishmentCount: 0, loyaltyLevel: "Bronze",
            };
            await db.collection("globalCustomers").add(newCustomerData);
        } catch (error) {
            if (error.code === 'auth/email-already-exists') {
                throw new functions.https.HttpsError('already-exists', 'Este e-mail já está em uso por outra conta.');
            }
            throw new functions.https.HttpsError('internal', 'Erro ao criar o usuário: ' + error.message);
        }
    } else {
        const existingCustomerDoc = phoneQuery.docs[0];
        const existingCustomer = existingCustomerDoc.data();
        if (existingCustomer.uid && existingCustomer.email) {
            throw new functions.https.HttpsError('already-exists', 'Este número de telefone já está associado a uma conta ativa.');
        }
        try {
            userRecord = await admin.auth().createUser({ email, password, displayName: name, phoneNumber: `+55${normalizedPhone}` });
            await existingCustomerDoc.ref.update({
                uid: userRecord.uid, email: email, name: name,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            if (error.code === 'auth/email-already-exists') {
                throw new functions.https.HttpsError('already-exists', 'Este e-mail já está em uso por outra conta.');
            }
            throw new functions.https.HttpsError('internal', 'Erro ao vincular a nova conta: ' + error.message);
        }
    }

    const userProfile = {
        uid: userRecord.uid, email: userRecord.email, displayName: name,
        companyName: (role === 'business' || role === 'supplier') ? name : '',
        role, status: 'active',
        subscription: {
            planId: "free", status: "trialing",
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
            monthlyOrders: { count: 0, month: new Date().toISOString().slice(0, 7) }
        },
        businessProfile: role === 'business' ? { type: businessType, subCategory: '' } : null,
        supplierProfile: role === 'supplier' ? { type: supplierType, subCategory: supplierSubCategory } : null,
    };
    await db.collection("users").doc(userRecord.uid).set(userProfile);
    return { success: true, uid: userRecord.uid };
});


// ✅ 1. SEARCH USER BY WHATSAPP (Corrigido para SDK v2)
exports.searchUserByWhatsapp = onCall(async (request) => {
    console.log("Função chamada com data:", request.data);

    try {
        if (!request.data || !request.data.whatsapp) {
            console.log("Erro: Dados inválidos recebidos", request.data);
            throw new functions.https.HttpsError('invalid-argument', 'Número de WhatsApp é obrigatório');
        }

        const whatsappNumber = String(request.data.whatsapp).replace(/\D/g, '');
        console.log("Número limpo:", whatsappNumber);

        // Busca no Firestore
        let snapshot = await db.collection('users')
            .where("profile.whatsapp", "==", whatsappNumber)
            .where("role", "==", "customer")
            .limit(1)
            .get();

        if (snapshot.empty) {
            snapshot = await db.collection('users')
                .where("whatsapp", "==", whatsappNumber)
                .where("role", "==", "customer")
                .limit(1)
                .get();
        }

        if (snapshot.empty) {
            console.log("Nenhum usuário encontrado");
            return { exists: false, userProfile: null };
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        console.log("Usuário encontrado:", userDoc.id);
        return {
            exists: true,
            userProfile: {
                uid: userDoc.id,
                displayName: userData.displayName || '',
                email: userData.email || '',
                phone: userData.phone || '',
                profile: userData.profile || {}
            }
        };

    } catch (error) {
        console.error("Erro na função:", error);
        throw new functions.https.HttpsError('internal', 'Erro na busca: ' + error.message);
    }
});

// ✅ 2. OPTIMIZE AND RESIZE IMAGE (SDK v2)
const BUCKET_NAME = 'zeuspdv.firebasestorage.app';

exports.optimizeAndResizeImage = onObjectFinalized(
    {
        cpu: 1,
        memory: '512MiB',
        timeoutSeconds: 300,
        bucket: BUCKET_NAME,
    },
    async (event) => {
        const fileBucket = event.data.bucket;
        const filePath = event.data.name;
        const contentType = event.data.contentType;
        const metadata = event.data.metadata || {};

        if (!filePath.startsWith('uploads/') || !contentType.startsWith('image/') || filePath.startsWith('optimized/')) {
            console.log('Arquivo não qualificado para otimização. Ignorando.');
            return null;
        }

        if (!metadata || (!metadata.businessId && !metadata.supplierId)) {
            console.log('Metadados faltando. A imagem será otimizada, mas o Firestore não será atualizado.');
        }

        const fileName = path.basename(filePath);
        const bucket = admin.storage().bucket(fileBucket);
        const tempFilePath = path.join(os.tmpdir(), fileName);
        await bucket.file(filePath).download({ destination: tempFilePath });

        let finalMediumUrl = null;

        try {
            const sizes = { 'thumb_': 200, 'medium_': 600 };
            const uploadPromises = Object.entries(sizes).map(async ([prefix, size]) => {
                const fileBaseName = path.parse(fileName).name;
                const optimizedFileName = `${prefix}${fileBaseName}.webp`;
                const tempOptimizedPath = path.join(os.tmpdir(), optimizedFileName);
                const destinationPath = `optimized/${optimizedFileName}`;

                await sharp(tempFilePath)
                    .resize(size, size, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toFile(tempOptimizedPath);

                const [uploadedFile] = await bucket.upload(tempOptimizedPath, {
                    destination: destinationPath,
                    metadata: { contentType: 'image/webp' },
                    public: true,
                });

                if (prefix === 'medium_') {
                    finalMediumUrl = uploadedFile.publicUrl();
                }
                fs.unlinkSync(tempOptimizedPath);
            });
            await Promise.all(uploadPromises);

            // Atualização do Firestore
            if (finalMediumUrl && metadata) {
                let docRef;
                let updateData;

                // 1. PRIMEIRO, verifique se é uma imagem de PRODUTO
                if (metadata.productId && metadata.businessId) {
                    functions.logger.log(`Atualizando imagem para o PRODUTO ${metadata.productId}`);
                    docRef = db.collection('products').doc(metadata.productId);
                    // Atualiza a URL pública e também o caminho para futuras exclusões
                    updateData = { imageUrl: finalMediumUrl, imagePath: filePath };
                }
                // verifique se é uma imagem de INSUMOS/INGREDIENTES
                else if (metadata.supplyId && metadata.businessId) {
                    functions.logger.log(`Atualizando imagem para o INSUMO ${metadata.supplyId}`);
                    docRef = db.collection('supplies').doc(metadata.supplyId);
                    updateData = { imageUrl: finalMediumUrl, imagePath: filePath };
                }
                // 2. DEPOIS, verifique os outros casos
                else if (metadata.extensionId && metadata.imageType) {
                    functions.logger.log(`Atualizando imagem para a EXTENSÃO ${metadata.extensionId}`);
                    docRef = db.collection('extensions').doc(metadata.extensionId);
                    updateData = { [`mediaAssets.${metadata.imageType}`]: finalMediumUrl };
                } else if (metadata.businessId) {
                    functions.logger.log(`Atualizando LOGO para o NEGÓCIO ${metadata.businessId}`);
                    docRef = db.collection('businessProfiles').doc(metadata.businessId);
                    updateData = { logoUrl: finalMediumUrl };
                } else if (metadata.supplierId) {
                    functions.logger.log(`Atualizando LOGO para o FORNECEDOR ${metadata.supplierId}`);
                    docRef = db.collection('suppliers').doc(metadata.supplierId);
                    updateData = { logoUrl: finalMediumUrl };
                }

                if (docRef) {
                    await docRef.set(updateData, { merge: true });
                    console.log('Documento no Firestore atualizado com a nova URL.');
                }
            }

        } finally {
            fs.unlinkSync(tempFilePath);
          //  await bucket.file(filePath).delete();
        }
        console.log(`Otimização de ${fileName} concluída.`);
        return null;
    }
);

// ✅ 3. CREATE USER PROFILE (SDK v2)
exports.createUserProfile = onCall(async (request) => {
    if (request.auth) {
        throw new functions.https.HttpsError('permission-denied', 'Usuário já autenticado.');
    }

    const payload = request.data;

    if (!payload || !payload.email || !payload.password || !payload.name || !payload.role) {
        throw new functions.https.HttpsError('invalid-argument', 'Dados essenciais (email, senha, nome, função) estão faltando.');
    }

    if (payload.role === 'business' && (!payload.businessType || !payload.businessSubCategory)) {
        throw new functions.https.HttpsError('invalid-argument', 'Para negócios, o tipo e a subcategoria são obrigatórios.');
    }

    if (payload.role === 'supplier' && (!payload.supplierType || !payload.supplierSubCategory)) {
        throw new functions.https.HttpsError('invalid-argument', 'Para fornecedores, o tipo e a subcategoria são obrigatórios.');
    }

    if (payload.role === 'customer' && !payload.whatsapp) {
        throw new functions.https.HttpsError('invalid-argument', 'WhatsApp é obrigatório para clientes.');
    }

    let userRecord;
    try {
        userRecord = await admin.auth().createUser({
            email: payload.email,
            password: payload.password,
            displayName: payload.name,
        });
    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'Este e-mail já está cadastrado.');
        }
        throw new functions.https.HttpsError('internal', 'Erro ao criar usuário na autenticação.');
    }

    const userProfile = {
        uid: userRecord.uid,
        email: payload.email,
        role: payload.role,
        displayName: payload.name,
        companyName: payload.name,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        profile: {
            whatsapp: payload.whatsapp || null,
        }
    };

    if (payload.role === 'business') {
        userProfile.businessProfile = { type: payload.businessType, subCategory: payload.businessSubCategory };
        userProfile.businessId = userRecord.uid;

        const businessProfileRef = db.collection('businessProfiles').doc(userRecord.uid);
        await businessProfileRef.set({
            name: payload.name,
            ownerId: userRecord.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    if (payload.role === 'supplier') {
        userProfile.supplierProfile = { type: payload.supplierType, subCategory: payload.supplierSubCategory };
        userProfile.supplierId = userRecord.uid;

        const supplierProfileRef = db.collection('supplierProfiles').doc(userRecord.uid);
        await supplierProfileRef.set({
            name: payload.name,
            ownerId: userRecord.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('suppliers').doc(userRecord.uid).set({
            name: payload.name,
            email: payload.email,
            isPartner: true,
            ownerId: userRecord.uid,
            associatedBusinesses: []
        });
    }

    await db.collection('users').doc(userRecord.uid).set(userProfile);

    return { result: `Usuário ${userRecord.uid} criado com sucesso!` };
});

// ✅ 4. CALCULATE RELEVANCE SCORES (SDK v2)
exports.calculateRelevanceScores = onSchedule('every 24 hours', async (event) => {
    console.log('Iniciando cálculo de scores de relevância...');
    const storesSnapshot = await db.collection('users').where('role', '==', 'business').where('businessProfile.type', '==', 'retail').get();

    if (storesSnapshot.empty) {
        console.log("Nenhuma loja encontrada para calcular scores.");
        return null;
    }

    const batch = db.batch();
    const now = new Date();

    for (const doc of storesSnapshot.docs) {
        const storeId = doc.id;
        const storeData = doc.data();

        const pageViews = Math.floor(Math.random() * 5000);
        const timeSpent = Math.floor(Math.random() * 300);
        const salesCount = Math.floor(Math.random() * 100);
        const rating = (Math.random() * 1.5 + 3.5).toFixed(1);

        const popularityScore = Math.min(pageViews / 5000, 1);
        const engagementScore = Math.min(timeSpent / 300, 1);
        const conversionScore = Math.min(salesCount / 100, 1);
        const qualityScore = (rating - 3.5) / 1.5;

        const weights = { popularity: 0.25, engagement: 0.35, conversion: 0.25, quality: 0.15 };

        let relevanceScore = (
            popularityScore * weights.popularity +
            engagementScore * weights.engagement +
            conversionScore * weights.conversion +
            qualityScore * weights.quality
        ) * 100;

        if (storeData.createdAt) {
            const createdAt = storeData.createdAt.toDate();
            const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
            const boostDurationDays = 14;

            if (daysSinceCreation < boostDurationDays) {
                const boostFactor = 1 - (daysSinceCreation / boostDurationDays);
                const newcomerBoost = 30 * boostFactor;
                relevanceScore += newcomerBoost;
                console.log(`Aplicando Newcomer Boost de ${newcomerBoost.toFixed(2)} para a loja ${storeData.companyName}`);
            }
        }

        const storeProfileRef = db.collection('businessProfiles').doc(storeId);

        batch.set(storeProfileRef, {
            relevanceScore: Math.min(100, parseFloat(relevanceScore.toFixed(2))),
            analytics: {
                pageViews,
                avgTimeSpent: timeSpent,
                salesCount,
                avgRating: parseFloat(rating)
            }
        }, { merge: true });
    }

    await batch.commit();
    console.log(`Scores de relevância atualizados para ${storesSnapshot.size} lojas.`);
    return null;
});

// ✅ 5. FINALIZE SALE AND PROCESS AFFILIATE (SDK v2)
const PLATFORM_PERFORMANCE_FEE_PERCENTAGE = 0.20;

exports.finalizeSaleAndProcessAffiliate = onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Você precisa estar logado para realizar esta operação.");
    }

    const { orderData, affiliateData } = request.data;

    if (!orderData || !orderData.items || !orderData.businessId) {
        throw new functions.https.HttpsError("invalid-argument", "Dados do pedido incompletos.");
    }

    try {
        const saleRef = db.collection("sales").doc();

        await db.runTransaction(async (transaction) => {
            if (affiliateData && affiliateData.refId && affiliateData.campaignId) {
                const campaignRef = db.collection("campaigns").doc(affiliateData.campaignId);
                const campaignDoc = await transaction.get(campaignRef);

                if (campaignDoc.exists) {
                    const campaign = campaignDoc.data();
                    const cpa = campaign.cpa;

                    if (campaign.remainingBudget >= cpa) {
                        const platformFee = cpa * PLATFORM_PERFORMANCE_FEE_PERCENTAGE;
                        const affiliatePayout = cpa - platformFee;

                        transaction.update(campaignRef, { remainingBudget: admin.firestore.FieldValue.increment(-cpa) });

                        const affiliateRef = db.collection("users").doc(affiliateData.refId);
                        transaction.update(affiliateRef, { affiliateBalance: admin.firestore.FieldValue.increment(affiliatePayout) });

                        const conversionRef = db.collection("conversions").doc();
                        transaction.set(conversionRef, {
                            campaignId: affiliateData.campaignId,
                            affiliateId: affiliateData.refId,
                            saleId: saleRef.id,
                            businessId: orderData.businessId,
                            cpaPaid: cpa,
                            platformFee,
                            affiliatePayout,
                            timestamp: admin.firestore.FieldValue.serverTimestamp(),
                        });
                    }
                }
            }

            for (const item of orderData.items) {
                if (item.productStructure === 'producao' && item.recipe) {
                    for (const recipeItem of item.recipe) {
                        const supplyRef = db.collection("supplies").doc(recipeItem.supplyId);
                        transaction.update(supplyRef, { stockQuantity: admin.firestore.FieldValue.increment(-recipeItem.quantity * item.qty) });
                    }
                } else if (item.productStructure === 'simples') {
                    const productRef = db.collection("products").doc(item.productId);
                    transaction.update(productRef, { stockQuantity: admin.firestore.FieldValue.increment(-item.qty) });
                }
            }

            transaction.set(saleRef, {
                ...orderData,
                affiliateId: affiliateData?.refId || null,
                campaignId: affiliateData?.campaignId || null,
            });

            if (orderData.tableId && orderData.id) {
                transaction.delete(db.collection('orders').doc(orderData.id));
                transaction.update(db.collection('tables').doc(orderData.tableId), { status: 'livre', currentOrderId: null });
            }
        });

        return { success: true, message: "Venda finalizada com sucesso!", saleId: saleRef.id };

    } catch (error) {
        console.error("Erro na transação de finalização de venda:", error);
        throw new functions.https.HttpsError("internal", "Ocorreu um erro ao processar a venda. A operação foi cancelada.", error);
    }
});

// ✅ 6. SUPPLIER CAMPAIGN FUNCTIONS (SDK v2)
exports.logSupplierCampaignImpression = onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Ação permitida apenas para usuários logados.');
    }

    const { campaignIds } = request.data;
    if (!Array.isArray(campaignIds) || campaignIds.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'IDs de campanha são necessários.');
    }

    const batch = db.batch();
    const viewerId = request.auth.uid;

    const userDoc = await db.collection('users').doc(viewerId).get();
    const viewerRole = userDoc.exists ? userDoc.data().role : 'unknown';

    campaignIds.forEach(campaignId => {
        const impressionRef = db.collection('supplierCampaigns').doc(campaignId).collection('analytics').doc();
        batch.set(impressionRef, {
            type: 'impression',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            viewerId: viewerId,
            viewerRole: viewerRole
        });
    });

    await batch.commit();
    return { success: true, message: `${campaignIds.length} impressões registradas.` };
});

exports.trackSupplierCampaignClick = onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Ação permitida apenas para usuários logados.');
    }

    const { campaignId } = request.data;
    if (!campaignId) {
        throw new functions.https.HttpsError('invalid-argument', 'ID da campanha é obrigatório.');
    }

    const campaignRef = db.collection('supplierCampaigns').doc(campaignId);
    const clickRef = campaignRef.collection('analytics').doc();

    const campaignDoc = await campaignRef.get();
    if (!campaignDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Campanha não encontrada.');
    }

    const viewerId = request.auth.uid;
    const userDoc = await db.collection('users').doc(viewerId).get();
    const viewerRole = userDoc.exists ? userDoc.data().role : 'unknown';

    await clickRef.set({
        type: 'click',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        viewerId: viewerId,
        viewerRole: viewerRole
    });

    return { redirectUrl: campaignDoc.data().ctaLink || '/' };
});

exports.aggregateSupplierCampaignAnalytics = onSchedule('every 60 minutes', async (event) => {
    console.log("Executando agregação de analytics para campanhas de fornecedores...");
    const campaignsRef = db.collection('supplierCampaigns').where('status', '==', 'active');
    const snapshot = await campaignsRef.get();

    if (snapshot.empty) {
        console.log("Nenhuma campanha de fornecedor ativa para analisar.");
        return null;
    }

    const batch = db.batch();

    for (const doc of snapshot.docs) {
        const campaignId = doc.id;
        const analyticsRef = db.collection('supplierCampaigns').doc(campaignId).collection('analytics');
        const analyticsSnapshot = await analyticsRef.get();

        let totalImpressions = 0;
        let totalClicks = 0;
        const uniqueImpressionViewers = new Set();
        const uniqueClickViewers = new Set();

        analyticsSnapshot.forEach(analyticDoc => {
            const data = analyticDoc.data();
            if (data.type === 'impression') {
                totalImpressions++;
                uniqueImpressionViewers.add(data.viewerId);
            } else if (data.type === 'click') {
                totalClicks++;
                uniqueClickViewers.add(data.viewerId);
            }
        });

        const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

        const summary = {
            totalImpressions,
            totalClicks,
            uniqueImpressions: uniqueImpressionViewers.size,
            uniqueClicks: uniqueClickViewers.size,
            ctr: parseFloat(ctr.toFixed(2))
        };

        batch.update(doc.ref, { analyticsSummary: summary });
    }

    await batch.commit();
    console.log(`Resumos de ${snapshot.size} campanhas de fornecedores atualizados.`);
    return null;
});

// ✅ 7. OTHER FUNCTIONS (SDK v2)
exports.logCampaignPlacementImpression = onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Ação permitida apenas para usuários logados.');
    }

    const { impressions } = request.data;

    if (!Array.isArray(impressions) || impressions.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Dados de impressão são necessários.');
    }

    const batch = db.batch();
    const viewerId = request.auth.uid;
    const userDoc = await db.collection('users').doc(viewerId).get();
    const viewerRole = userDoc.exists ? userDoc.data().role : 'unknown';

    impressions.forEach(impression => {
        const { campaignId, placement } = impression;
        const impressionRef = db.collection('supplierCampaigns').doc(campaignId).collection('analytics').doc();
        batch.set(impressionRef, {
            type: 'impression',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            viewerId: viewerId,
            viewerRole: viewerRole,
            placement: placement
        });
    });

    await batch.commit();
    return { success: true, message: `${impressions.length} impressões registradas.` };
});

exports.acceptInfluencerCampaign = onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Ação permitida apenas para usuários logados.');
    }

    const { campaignId } = request.data;
    const influencerId = request.auth.uid;

    const campaignRef = db.collection('supplierCampaigns').doc(campaignId);

    await db.runTransaction(async (transaction) => {
        const campaignDoc = await transaction.get(campaignRef);
        if (!campaignDoc.exists || campaignDoc.data().billingModel !== 'cpi') {
            throw new functions.https.HttpsError('not-found', 'Campanha inválida para esta ação.');
        }

        const campaignData = campaignDoc.data();
        const cpiCost = campaignData.cpiBid || 1;

        if (campaignData.remainingBudget < cpiCost) {
            throw new functions.https.HttpsError('resource-exhausted', 'Orçamento da campanha esgotado.');
        }

        const engagementRef = campaignRef.collection('engagements').doc(influencerId);
        transaction.set(engagementRef, { acceptedAt: admin.firestore.FieldValue.serverTimestamp() });

        transaction.update(campaignRef, {
            remainingBudget: admin.firestore.FieldValue.increment(-cpiCost),
            'analyticsSummary.engagements': admin.firestore.FieldValue.increment(1),
            'analyticsSummary.budgetSpent': admin.firestore.FieldValue.increment(cpiCost)
        });
    });

    return { success: true, message: "Campanha aceita! O link já está disponível para você." };
});

exports.handleExtensionBilling = onSchedule('0 0 1 * *', async (event) => {
    console.log("Iniciando rotina de faturamento de extensões...");
    const usersSnapshot = await db.collection('users').get();
    const extensionsSnapshot = await db.collection('extensions').get();
    const extensionsData = new Map(extensionsSnapshot.docs.map(doc => [doc.id, doc.data()]));

    for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const installedExtensionsSnapshot = await db.collection('users').doc(userId).collection('installed_extensions').get();

        if (installedExtensionsSnapshot.empty) {
            continue;
        }

        let totalMonthlyCost = 0;
        let partnerPayouts = {};

        installedExtensionsSnapshot.forEach(installDoc => {
            const installData = installDoc.data();
            const extension = extensionsData.get(installData.extensionId);

            if (extension && extension.priceMonthly > 0) {
                totalMonthlyCost += extension.priceMonthly;

                if (extension.authorType === 'partner' && extension.platformFeePercentage > 0) {
                    const payout = extension.priceMonthly * (1 - extension.platformFeePercentage);
                    if (!partnerPayouts[extension.authorId]) {
                        partnerPayouts[extension.authorId] = 0;
                    }
                    partnerPayouts[extension.authorId] += payout;
                }
            }
        });

        if (totalMonthlyCost > 0) {
            console.log(`Usuário ${userId} tem uma fatura de ${totalMonthlyCost} para extensões.`);
            // AQUI ENTRARIA A LÓGICA DE COBRANÇA REAL (ex: criar fatura no Stripe)
            // await stripe.invoices.create({ customer: userDoc.data().stripeId, amount: totalMonthlyCost * 100, ... });

            // Após cobrança bem-sucedida, registrar os repasses
            for (const partnerId in partnerPayouts) {
                console.log(`Registrando repasse de ${partnerPayouts[partnerId]} para parceiro ${partnerId}`);
                // await db.collection('payouts').add({ ... });
            }
        }
    }
    console.log("Rotina de faturamento de extensões concluída.");
    return null;
});

// ✅ 8. MERCADO LIVRE FUNCTIONS (SDK v2)

exports.mercadolivreAuthRedirect = onCall(
    {
        // Garante que apenas nosso app pode chamar e lida com o CORS
        enforceAppCheck: true,
        cors: [/localhost:\d+$/, "zeuspdv.web.app", "zeuspdv.firebaseapp.com"]
    },
    (request) => {
        // Com onCall, a verificação de autenticação é automática.
        // O UID do usuário está em request.auth.uid
        if (!request.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Ação não permitida.');
        }

        const MELI_APP_ID = process.env.MELI_APP_ID;
        const MELI_REDIRECT_URI = `https://us-central1-zeuspdv.cloudfunctions.net/mercadolivreAuthCallback`;

        const authUrl = `https://auth.mercadolibre.com/authorization?response_type=code&client_id=${MELI_APP_ID}&redirect_uri=${MELI_REDIRECT_URI}&state=${request.auth.uid}`;

        // Com onCall, basta retornar o objeto. O Firebase cuida do resto.
        return { authUrl: authUrl };
    }
);

// ✅ 9. HTTP FUNCTION V2
exports.mercadolivreAuthCallback = onRequest(
    {
        // --- ESTA É A LINHA MAIS IMPORTANTE ---
        invoker: "public", // Torna a função publicamente acessível
        region: "us-central1" // Especifica a região
    },
    async (req, res) => {
        // A lógica interna permanece a mesma, mas usamos 'cors' para segurança
        cors(req, res, async () => {
            const code = req.query.code;
            const businessId = req.query.state;

            if (!code || !businessId) {
                res.status(400).send("Código de autorização ou ID do usuário (state) faltando.");
                return;
            }

            try {
                const MELI_APP_ID = process.env.MELI_APP_ID;
                const MELI_CLIENT_SECRET = process.env.MELI_CLIENT_SECRET;
                const MELI_REDIRECT_URI = `https://us-central1-zeuspdv.cloudfunctions.net/mercadolivreAuthCallback`;

                const params = new URLSearchParams();
                params.append('grant_type', 'authorization_code');
                params.append('client_id', MELI_APP_ID);
                params.append('client_secret', MELI_CLIENT_SECRET);
                params.append('code', code);
                params.append('redirect_uri', MELI_REDIRECT_URI);

                const response = await axios.post('https://api.mercadolibre.com/oauth/token', params);
                const tokens = response.data;

                const integrationRef = db.doc(`users/${businessId}/integrations/mercadolivre`);
                await integrationRef.set({
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    meliUserId: tokens.user_id,
                    expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + (tokens.expires_in * 1000)),
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                });

                res.status(200).send("<html><body style='font-family: sans-serif; text-align: center; padding-top: 50px;'><h1>Autenticação Concluída com Sucesso!</h1><p>Você pode fechar esta janela agora.</p><script>window.close();</script></body></html>");

            } catch (error) {
                console.error("Erro ao obter tokens do Mercado Livre:", error.response?.data || error.message);
                res.status(500).send("Falha ao autenticar com o Mercado Livre. Por favor, tente novamente.");
            }
        });
    }
);

// ✅ 10. ON PRODUCT STOCK UPDATE (SDK v2)
/**
 * [SDK v2] Dispara quando o estoque de um produto é alterado no nosso sistema
 * para sincronizar com o Mercado Livre.
 */
exports.onProductStockUpdate = onDocumentUpdated("products/{productId}", async (event) => {
    if (!event.data) {
        console.log("Evento sem dados, ignorando.");
        return null;
    }

    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.stockQuantity === after.stockQuantity) {
        return null;
    }

    const businessId = after.businessId;
    const meliItemId = after.meliItemId;

    if (!meliItemId) {
        console.log(`Produto ${event.params.productId} não está vinculado ao ML. Ignorando.`);
        return null;
    }

    try {
        const accessToken = await getValidMeliToken(after.businessId);

        await axios.put(`https://api.mercadolibre.com/items/${after.meliItemId}`,
            { available_quantity: after.stockQuantity },
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        console.log(`Estoque do item ${after.meliItemId} sincronizado para: ${after.stockQuantity}`);
        return null;
    } catch (error) {
        console.error(`Falha ao sincronizar estoque para o item ${after.meliItemId}:`, error.response?.data || error.message);
        return null;
    }
});

// ✅ 11. MERCADO LIVRE WEBHOOK (Mantida como v1)
exports.mercadolivreWebhookReceiver = functions.https.onRequest(async (req, res) => {
    console.log("Webhook do Mercado Livre recebido!");
    const notification = req.body;

    // 1. Validar a notificação para garantir que ela veio do ML

    if (notification.topic === 'orders_v2') {
        const orderId = notification.resource.split('/').pop();
        // 1. Usar a API do ML para buscar os detalhes completos do pedido com o orderId
        // 2. Salvar os detalhes em uma nova coleção `mercadolivre_orders` no nosso Firestore
        // 3. Disparar uma notificação para o painel do usuário
        console.log(`Processando novo pedido do ML: ${orderId}`);
    } else if (notification.topic === 'questions') {
        const questionId = notification.resource.split('/').pop();
        // 1. Usar a API do ML para buscar os detalhes da pergunta
        // 2. Salvar em uma coleção `mercadolivre_questions`
        // 3. Disparar notificação
        console.log(`Processando nova pergunta do ML: ${questionId}`);
    }

    res.status(200).send("OK"); // Responde ao ML que recebemos com sucesso
});


exports.publishProductToML = onCall({
    enforceAppCheck: true,
    cors: [/localhost:\d+$/, "zeuspdv.web.app"]
}, async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Ação não permitida.');
    }

    const businessId = request.auth.uid;
    const { productId, categoryId } = request.data;

    if (!productId || !categoryId) {
        throw new functions.https.HttpsError('invalid-argument', 'O ID do produto e da categoria são obrigatórios.');
    }

    try {
        const accessToken = await getValidMeliToken(businessId);
        const productRef = db.doc(`products/${productId}`);
        const productDoc = await productRef.get();

        if (!productDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Produto não encontrado.');
        }

        const productData = productDoc.data();

        // 1. Primeiro, obter os atributos obrigatórios da categoria
        const categoryAttributes = await getCategoryRequiredAttributes(categoryId, accessToken);

        // 2. Construir os atributos do produto baseado nos requerimentos da categoria
        const attributes = await buildProductAttributes(productData, categoryAttributes, accessToken);

        const meliItem = {
            title: productData.name.substring(0, 60), // Limitar título
            category_id: categoryId,
            price: productData.salePrice,
            currency_id: "BRL",
            available_quantity: productData.stockQuantity > 0 ? productData.stockQuantity : 1,
            buying_mode: "buy_it_now",
            listing_type_id: "gold_special",
            condition: "new",
            pictures: productData.imageUrl ? [{ source: productData.imageUrl }] : [],
            attributes: attributes // Adicionar atributos obrigatórios
        };

        console.log("Publicando produto no ML:", JSON.stringify(meliItem, null, 2));

        const response = await axios.post('https://api.mercadolibre.com/items', meliItem, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        const meliResponseData = response.data;

        // Salva o ID do item do ML de volta no nosso produto
        await productRef.update({
            meliItemId: meliResponseData.id,
            meliPermalink: meliResponseData.permalink,
            meliCategoryId: categoryId,
            lastMeliSync: new Date()
        });

        return {
            success: true,
            message: "Produto publicado no Mercado Livre!",
            permalink: meliResponseData.permalink,
            itemId: meliResponseData.id
        };

    } catch (error) {
        console.error("Erro ao publicar no ML:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        const errorMessage = error.response?.data?.message ||
            error.response?.data?.error ||
            'Falha ao publicar produto.';

        throw new functions.https.HttpsError('internal', errorMessage);
    }
});

// Função para obter atributos obrigatórios da categoria
async function getCategoryRequiredAttributes(categoryId, accessToken) {
    try {
        const response = await axios.get(`https://api.mercadolibre.com/categories/${categoryId}/attributes`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            timeout: 10000
        });

        // Filtrar apenas atributos obrigatórios
        const requiredAttributes = response.data.filter(attr =>
            attr.tags?.required === true ||
            attr.tags?.catalog_required === true ||
            attr.tags?.hidden !== true
        );

        return requiredAttributes;
    } catch (error) {
        console.error("Erro ao obter atributos da categoria:", error.message);
        return []; // Retorna array vazio em caso de erro
    }
}

// Função para construir atributos do produto
async function buildProductAttributes(productData, categoryAttributes, accessToken) {
    const attributes = [];

    // Atributos básicos que sempre devem ser enviados
    const basicAttributes = [
        {
            id: "ITEM_CONDITION",
            value_name: "Novo"
        },
        {
            id: "BRAND",
            value_name: productData.brand || "Genérico"
        }
    ];

    attributes.push(...basicAttributes);

    // Processar atributos obrigatórios da categoria
    for (const attr of categoryAttributes) {
        let attributeValue = null;

        // Mapear atributos comuns
        switch (attr.id) {
            case "SIZE_GRID_ID":
                // Para grade de tamanhos, usar um valor padrão
                attributeValue = await getDefaultSizeGrid(attr, accessToken);
                break;

            case "MODEL":
                attributeValue = productData.model || productData.name;
                break;

            case "COLOR":
                attributeValue = productData.color || "Preto";
                break;

            case "GENDER":
                attributeValue = "Unissex";
                break;

            default:
                // Para outros atributos, tentar encontrar um valor padrão
                if (attr.values && attr.values.length > 0) {
                    attributeValue = attr.values[0].name;
                } else {
                    attributeValue = "Não especificado";
                }
        }

        if (attributeValue) {
            attributes.push({
                id: attr.id,
                value_name: attributeValue
            });
        }
    }

    return attributes;
}

// Função para obter grade de tamanhos padrão
async function getDefaultSizeGrid(attribute, accessToken) {
    try {
        // Se a attribute tem valores pré-definidos, usar o primeiro
        if (attribute.values && attribute.values.length > 0) {
            return attribute.values[0].name;
        }

        // Para categorias de roupa, tentar obter grades disponíveis
        if (attribute.id === "SIZE_GRID_ID") {
            const response = await axios.get('https://api.mercadolibre.com/sites/MLB/listing_type_groups', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                timeout: 8000
            });

            // Procurar por grades de tamanho padrão
            const sizeGrids = response.data.find(group => group.name === "size_chart");
            if (sizeGrids && sizeGrids.listing_types) {
                return sizeGrids.listing_types[0]?.id || "BR_STANDARD";
            }
        }

        return "BR_STANDARD"; // Valor padrão para Brasil
    } catch (error) {
        console.error("Erro ao obter grade de tamanhos:", error.message);
        return "BR_STANDARD";
    }
}

exports.getMercadoLivreCategory = onCall({
    enforceAppCheck: true,
    cors: [/localhost:\d+$/, "zeuspdv.web.app", "zeuspdv.firebaseapp.com"]
}, async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Ação não permitida.');
    }

    const { title } = request.data;
    if (!title) {
        throw new functions.https.HttpsError('invalid-argument', 'O título do produto é obrigatório.');
    }

    const businessId = request.auth.uid;

    try {
        // Obter token de acesso
        const accessToken = await getValidMeliToken(businessId);

        const searchTerm = encodeURIComponent(title.substring(0, 60)); // Limita para evitar problemas
        const limit = 5;

        // ENDPOINT CORRETO baseado na documentação oficial
        const url = `https://api.mercadolibre.com/sites/MLB/domain_discovery/search?q=${searchTerm}&limit=${limit}`;

        console.log(`Chamando API do ML: ${url}`);

        const meliResponse = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        // Formatar a resposta conforme documentação
        const suggestions = meliResponse.data.map(item => ({
            domain_id: item.domain_id,
            domain_name: item.domain_name,
            category_id: item.category_id,
            category_name: item.category_name,
            attributes: item.attributes || []
        }));

        return {
            success: true,
            suggestions: suggestions
        };

    } catch (error) {
        console.error("Erro ao chamar API do ML:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: error.config?.url
        });

        // Tratamento específico de erros
        if (error.response?.status === 401) {
            throw new functions.https.HttpsError('unauthenticated', 'Token do Mercado Livre inválido ou expirado.');
        } else if (error.response?.status === 404) {
            // Fallback: Tentar método alternativo se o endpoint principal falhar
            return await tryAlternativeSearchMethod(title, businessId);
        } else if (error.code === 'ECONNABORTED') {
            throw new functions.https.HttpsError('deadline-exceeded', 'Tempo limite excedido ao comunicar com o Mercado Livre.');
        } else if (error.response?.status >= 500) {
            throw new functions.https.HttpsError('unavailable', 'Serviço do Mercado Livre indisponível no momento.');
        } else {
            throw new functions.https.HttpsError('internal', 'Falha ao comunicar com o Mercado Livre.');
        }
    }
});

// Método alternativo usando search API
async function tryAlternativeSearchMethod(title, businessId) {
    try {
        const accessToken = await getValidMeliToken(businessId);
        const searchTerm = encodeURIComponent(title.substring(0, 50));

        // Método alternativo: buscar produtos similares e extrair categorias
        const searchUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${searchTerm}&limit=5`;

        const searchResponse = await axios.get(searchUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 8000
        });

        // Extrair categorias únicas dos resultados
        const categories = new Map();
        searchResponse.data.results?.forEach(product => {
            if (product.category_id && product.category_name) {
                categories.set(product.category_id, {
                    domain_id: product.domain_id || 'MLB',
                    domain_name: product.domain_name || 'Mercado Livre',
                    category_id: product.category_id,
                    category_name: product.category_name,
                    attributes: []
                });
            }
        });

        return {
            success: true,
            suggestions: Array.from(categories.values())
        };

    } catch (fallbackError) {
        console.error("Erro no método alternativo:", fallbackError);
        throw new functions.https.HttpsError('not-found', 'Não foi possível encontrar categorias para este produto.');
    }
}



/**
 * NOVA FUNÇÃO (Corrigida para v2)
 * Cria um pagamento PIX no Mercado Pago para um pedido específico.
 */
exports.createPixPayment = onCall(async (request) => {
    // Em v2, 'data' e 'auth' vêm dentro do objeto 'request'
    const data = request.data;
    const auth = request.auth;

    if (!auth) {
        throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado.");
    }

    const { orderId, amount, customerName, customerEmail } = data;

    if (!orderId || !amount) {
        throw new functions.https.HttpsError("invalid-argument", "Faltando orderId ou amount.");
    }

    // URL do seu webhook (Ajuste para a sua URL real do Cloud Functions)
    const notificationUrl = `https://us-central1-zeuspdv.cloudfunctions.net/mercadoPagoWebhook`;

    const payment_data = {
        transaction_amount: Number(amount.toFixed(2)),
        description: `Pedido #${orderId} - ${customerName}`,
        payment_method_id: "pix",
        notification_url: notificationUrl,
        external_reference: orderId, // Vincula o pagamento ao pedido
        payer: {
            email: customerEmail || "nao_informado@foodpdv.com",
            first_name: customerName || "Cliente",
        },
    };

    try {
        const payment = await client.payment.create({ body: payment_data });

        const pixData = {
            paymentId: payment.id,
            qrCodeBase64: payment.point_of_interaction.transaction_data.qr_code_base64,
            qrCode: payment.point_of_interaction.transaction_data.qr_code,
        };

        // Salva os dados do PIX no pedido para referência
        await admin.firestore().collection("orders").doc(orderId).update({
            pixPaymentId: pixData.paymentId,
        });

        return pixData;
    } catch (error) {
        console.error("Erro ao criar PIX Mercado Pago:", error);
        throw new functions.https.HttpsError("internal", "Erro ao gerar PIX: " + error.message);
    }
});

/**
 * NOVA FUNÇÃO (Corrigida para v2)
 * Webhook para receber notificações de pagamento do Mercado Pago.
 */
exports.mercadoPagoWebhook = onRequest(async (req, res) => {
    // Responde ao Mercado Pago imediatamente para evitar timeouts
    res.status(200).send("OK");

    const { type, data } = req.body;

    if (type === "payment") {
        try {
            const paymentId = data.id;
            // Busca o pagamento atualizado
            const payment = await client.payment.get({ id: paymentId });

            if (payment) {
                const orderId = payment.external_reference;
                const status = payment.status;

                if (orderId && status === "approved") {
                    // Pagamento APROVADO!
                    const orderRef = admin.firestore().collection("orders").doc(orderId);
                    
                    // Atualiza o status do pedido para "preparo"
                    await orderRef.update({
                        status: "preparo", 
                        paymentStatus: "paid",
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });

                    console.log(`Pedido ${orderId} atualizado para 'preparo'.`);
                } else if (orderId && (status === "cancelled" || status === "expired")) {
                    // Pagamento cancelado ou expirado
                     const orderRef = admin.firestore().collection("orders").doc(orderId);
                     await orderRef.update({
                        status: "canceled",
                        paymentStatus: "failed",
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    console.log(`Pedido ${orderId} cancelado.`);
                }
            }
        } catch (error) {
            console.error("Erro no webhook:", error);
        }
    }
});

  
exports.checkLowStockAndTriggerNexus = onSchedule('every 4 hours', async (event) => {
    functions.logger.log("Executando Nexus v2: Verificação de Estoque e Leilão de Ofertas...");
    const db = admin.firestore();

    try {
        // 1. Busca todas as campanhas de "Alerta de Estoque" ativas de uma só vez
        const campaignsQuery = db.collection('supplierCampaigns')
            .where('status', '==', 'active')
            .where('campaignObjective', '==', 'low_stock_alert')
            .where('remainingBudget', '>', 1); // Orçamento mínimo para participar
        const campaignsSnapshot = await campaignsQuery.get();
        const activeAlertCampaigns = campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (activeAlertCampaigns.length === 0) {
            functions.logger.log("Nenhuma campanha de alerta de estoque ativa. O Nexus operará em modo orgânico.");
        }

        // 2. Itera sobre os negócios
        const businessesSnapshot = await db.collection('users').where('role', '==', 'business').get();
        for (const businessDoc of businessesSnapshot.docs) {
            const businessId = businessDoc.id;
            const businessData = businessDoc.data();

            const suppliesQuery = db.collection('supplies')
                .where('businessId', '==', businessId)
                .where('minStockLevel', '>', 0);
            const suppliesSnapshot = await suppliesQuery.get();

            for (const supplyDoc of suppliesSnapshot.docs) {
                const supply = supplyDoc.data();
                const supplyId = supplyDoc.id;

                if ((supply.stockQuantity || 0) <= supply.minStockLevel) {
                    functions.logger.info(`Estoque baixo para "${supply.name}" em "${businessData.companyName}".`);

                    const existingNexusQuery = await db.collection('nexusPurchaseOrders').where('businessId', '==', businessId).where('supplyId', '==', supplyId).where('status', '==', 'draft').limit(1).get();
                    if (!existingNexusQuery.empty) {
                        functions.logger.info(`Rascunho Nexus para "${supply.name}" já existe. Pulando.`);
                        continue;
                    }

                    let quoteOptions = [];

                    // 3. Coleta de Cotações Orgânicas (dos fornecedores já vinculados)
                    if (supply.linkedProducts && supply.linkedProducts.length > 0) {
                        for (const link of supply.linkedProducts) {
                            if (link.supplierId && link.productId) {
                                const productSnap = await db.collection('supplierProducts').doc(link.productId).get();
                                if (productSnap.exists()) {
                                    const pData = productSnap.data();
                                    quoteOptions.push({
                                        isSponsored: false, // Marca como orgânico
                                        supplierId: link.supplierId,
                                        productId: link.productId,
                                        supplierName: pData.supplierName,
                                        productName: pData.productName,
                                        price: pData.price,
                                        unitOfSale: pData.unitOfSale
                                    });
                                }
                            }
                        }
                    }

                    // 4. Leilão de Cotações Patrocinadas
                    const supplyNameNormalized = supply.name.toLowerCase();
                    const matchingCampaigns = activeAlertCampaigns.filter(c =>
                        c.targetIngredientTags.some(tag => supplyNameNormalized.includes(tag.toLowerCase())) &&
                        (c.remainingBudget >= (c.cpcBid || 1.00)) // Garante que a campanha pode pagar pelo clique
                    );

                    if (matchingCampaigns.length > 0) {
                        // O leilão agora prioriza quem paga mais pelo clique (CPC)
                        matchingCampaigns.sort((a, b) => (b.cpcBid || 0) - (a.cpcBid || 0));
                        const winningCampaign = matchingCampaigns[0];

                        // Busca o produto específico da campanha para ter os dados de preço
                        const productSnap = await db.collection('supplierProducts').doc(winningCampaign.targetProductId).get();
                        if (productSnap.exists()) {
                            const pData = productSnap.data();
                            quoteOptions.push({
                                isSponsored: true, // Marca como patrocinado
                                campaignId: winningCampaign.id,
                                cpcBid: winningCampaign.cpcBid,
                                supplierId: winningCampaign.supplierId,
                                productId: winningCampaign.targetProductId,
                                supplierName: pData.supplierName,
                                productName: pData.productName,
                                price: pData.price,
                                unitOfSale: pData.unitOfSale
                            });
                        }
                    }

                    // 5. Criação do Pedido Nexus Inteligente
                    if (quoteOptions.length > 0) {
                        // Ordena as opções: patrocinado primeiro, depois os mais baratos
                        quoteOptions.sort((a, b) => {
                            if (a.isSponsored && !b.isSponsored) return -1;
                            if (!a.isSponsored && b.isSponsored) return 1;
                            return a.price - b.price;
                        });

                        const nexusOrderRef = db.collection('nexusPurchaseOrders').doc();
                        await nexusOrderRef.set({
                            businessId: businessId,
                            supplyId: supplyId,
                            supplyName: supply.name,
                            status: 'draft',
                            quoteOptions: quoteOptions.slice(0, 4), // Pega as 4 melhores opções (1 patrocinada + 3 orgânicas)
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                        functions.logger.log(`Cotação Nexus criada para "${supply.name}" com ${quoteOptions.length} opção(ões).`);
                    }
                }
            }
        }
        functions.logger.log("Verificação Nexus v2 concluída.");
        return null;
    } catch (error) {
        functions.logger.error("Erro crítico na função Nexus v2:", error);
        return null;
    }
});

exports.checkLowStockAndGenerateAlerts = onSchedule('every 4 hours', async (event) => {
    console.log("Iniciando verificação de estoque baixo...");
    const db = admin.firestore();

    const campaignsQuery = db.collection('supplierCampaigns')
        .where('status', '==', 'active')
        .where('campaignObjective', '==', 'low_stock_alert')
        .where('remainingBudget', '>', 0.50); // Garante que há orçamento mínimo para o alerta
    const campaignsSnapshot = await campaignsQuery.get();
    const activeAlertCampaigns = campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (activeAlertCampaigns.length === 0) {
        console.log("Nenhuma campanha de alerta de estoque ativa. Encerrando.");
        return null;
    }

    const businessesQuery = db.collection('users').where('role', '==', 'business');
    const businessesSnapshot = await businessesQuery.get();

    for (const businessDoc of businessesSnapshot.docs) {
        const businessId = businessDoc.id;
        const suppliesQuery = db.collection('supplies').where('businessId', '==', businessId);
        const suppliesSnapshot = await suppliesQuery.get();

        for (const supplyDoc of suppliesSnapshot.docs) {
            const supply = supplyDoc.data();

            if (supply.stockQuantity <= (supply.minStockLevel || 0)) {
                const existingNotifQuery = db.collection('users').doc(businessId).collection('notifications')
                    .where('type', '==', 'low_stock_alert')
                    .where('ingredientName', '==', supply.name)
                    .where('isRead', '==', false);
                const existingNotifSnapshot = await existingNotifQuery.get();
                if (!existingNotifSnapshot.empty) {
                    continue;
                }

                const supplyNameNormalized = supply.name.toLowerCase();
                const matchingCampaigns = activeAlertCampaigns.filter(c =>
                    c.targetIngredientTags.some(tag => supplyNameNormalized.includes(tag.toLowerCase())) &&
                    (c.remainingBudget >= (c.cpagBid || 0.50)) // Garante que a campanha pode pagar pelo alerta
                );

                if (matchingCampaigns.length > 0) {
                    // Leilão baseado no CPC, mas cobra o CPAG
                    matchingCampaigns.sort((a, b) => (b.cpcBid || 0) - (a.cpcBid || 0));
                    const winningCampaign = matchingCampaigns[0];
                    const costOfAlert = winningCampaign.cpagBid || 0.50;

                    const batch = db.batch();

                    // 1. Cria a notificação para o restaurante
                    const notificationRef = db.collection('users').doc(businessId).collection('notifications').doc();
                    batch.set(notificationRef, {
                        title: "Estoque Baixo!",
                        message: `Seu estoque de ${supply.name} está abaixo do nível mínimo.`,
                        type: 'low_stock_alert',
                        ingredientName: supply.name,
                        relatedCampaignId: winningCampaign.id,
                        isRead: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    // 2. ✅ LÓGICA DE COBRANÇA CPAG
                    const campaignRef = db.collection('supplierCampaigns').doc(winningCampaign.id);
                    batch.update(campaignRef, {
                        remainingBudget: admin.firestore.FieldValue.increment(-costOfAlert),
                        'analyticsSummary.budgetSpent': admin.firestore.FieldValue.increment(costOfAlert),
                        'analyticsSummary.impressions.low_stock_alerts': admin.firestore.FieldValue.increment(1) // Métrica nova
                    });

                    await batch.commit();
                    console.log(`Notificação e cobrança CPAG para ${supply.name} gerada para business ${businessId}, campanha ${winningCampaign.id}`);
                }
            }
        }
    }
    console.log("Verificação de estoque baixo concluída.");
    return null;
});

exports.logProductView = functions.https.onCall(async (data, context) => {
    // Verifica se o usuário está autenticado (opcional, mas bom para evitar spam)
    // if (!context.auth) {
    //   throw new functions.https.HttpsError('unauthenticated', 'Ação permitida apenas para usuários logados.');
    // }

    const { productId, businessId, source } = data;

    if (!productId || !businessId || !source) {
        throw new functions.https.HttpsError('invalid-argument', 'Faltam dados essenciais (productId, businessId, source).');
    }

    try {
        await admin.firestore().collection('product_analytics').add({
            productId,
            businessId,
            source,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, message: "Visualização registrada." };
    } catch (error) {
        console.error("Erro ao registrar visualização de produto:", error);
        throw new functions.https.HttpsError('internal', 'Não foi possível registrar a visualização.');
    }
});

exports.processNexusClick = onCall({ enforceAppCheck: true }, async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Ação não permitida.");
    }
    const { campaignId, cpcBid } = request.data;
    if (!campaignId || !cpcBid) {
        throw new functions.https.HttpsError("invalid-argument", "Dados da campanha incompletos.");
    }

    try {
        const campaignRef = db.collection('supplierCampaigns').doc(campaignId);
        await campaignRef.update({
            remainingBudget: admin.firestore.FieldValue.increment(-cpcBid),
            'analyticsSummary.budgetSpent': admin.firestore.FieldValue.increment(cpcBid),
            'analyticsSummary.totalClicks': admin.firestore.FieldValue.increment(1)
        });
        functions.logger.info(`Cobrança de CPC de ${cpcBid} processada para a campanha ${campaignId}.`);
        return { success: true };
    } catch (error) {
        functions.logger.error("Erro ao processar clique Nexus:", error);
        throw new functions.https.HttpsError("internal", "Falha ao processar cobrança do clique.");
    }
});

exports.getNexusDashboardStats = onCall({ enforceAppCheck: true }, async (request) => {
    // 1. Verifica se o usuário está autenticado
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Você precisa estar logado para acessar estes dados.");
    }

    const uid = request.auth.uid;
    const db = admin.firestore();

    try {
        // 2. Busca o perfil do usuário no Firestore para verificar a permissão
        const userDocRef = db.collection('users').doc(uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists() || userDoc.data()?.role !== 'superadmin') {
            functions.logger.warn(`Acesso negado para o UID: ${uid}. Role encontrada: ${userDoc.data()?.role}`);
            throw new functions.https.HttpsError("permission-denied", "Acesso negado. Apenas administradores podem visualizar este painel.");
        }

        // 3. Se a permissão for válida, executa a lógica principal da função
        const nexusOrdersSnap = await db.collection('nexusPurchaseOrders').get();
        const campaignsSnap = await db.collection('supplierCampaigns').where('campaignObjective', '==', 'low_stock_alert').get();

        let totalDrafts = 0;
        let totalApproved = 0;
        let totalDismissed = 0;
        let totalValueGenerated = 0;
        const campaignPerformance = {};

        nexusOrdersSnap.forEach(doc => {
            const order = doc.data();
            if (order.status === 'draft') totalDrafts++;
            if (order.status === 'dismissed') totalDismissed++;
            if (order.status === 'approved') {
                totalApproved++;
                const chosen = order.chosenOption;
                if (chosen) {
                    // A quantidade pode não estar no item raiz, mas sim dentro de 'items'
                    const quantity = order.items?.[0]?.quantity || 1;
                    const orderValue = chosen.price * quantity;
                    totalValueGenerated += orderValue;

                    if (chosen.isSponsored && chosen.campaignId) {
                        if (!campaignPerformance[chosen.campaignId]) {
                            campaignPerformance[chosen.campaignId] = { approvals: 0, totalValue: 0 };
                        }
                        campaignPerformance[chosen.campaignId].approvals++;
                        campaignPerformance[chosen.campaignId].totalValue += orderValue;
                    }
                }
            }
        });

        const topCampaigns = campaignsSnap.docs.map(doc => {
            const campaign = { id: doc.id, ...doc.data() };
            const performance = campaignPerformance[campaign.id] || { approvals: 0, totalValue: 0 };
            return {
                id: campaign.id,
                title: campaign.title,
                supplierName: campaign.supplierName,
                approvals: performance.approvals,
                totalValue: performance.totalValue,
                cpc: campaign.cpcBid || 0
            };
        }).sort((a, b) => b.approvals - a.approvals).slice(0, 5);

        return {
            totalDrafts,
            totalApproved,
            totalDismissed,
            conversionRate: (totalApproved + totalDismissed) > 0 ? (totalApproved / (totalApproved + totalDismissed)) * 100 : 0,
            totalValueGenerated,
            topCampaigns,
        };

    } catch (error) {
        // Se o erro já for um HttpsError (como o de permissão negada), apenas o relança
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        functions.logger.error("Erro ao gerar estatísticas do Nexus:", error);
        throw new functions.https.HttpsError("internal", "Falha ao buscar dados do dashboard Nexus.");
    }
});


exports.processMigrationBatch = functions.https.onCall(async (data, context) => {
    if (context.auth?.token.role !== 'superadmin') {
        throw new functions.https.HttpsError("permission-denied", "Ação não permitida.");
    }

    const { targetBusinessId, filesData, columnMapping, valueMapping } = data;
    const db = admin.firestore();

    try {
        // Simulação da leitura dos CSVs (no app real, viriam do request)
        const clientesCSV = filesData['clientes.csv'];
        const bairrosCSV = filesData['bairro.csv'];

        const clientes = Papa.parse(clientesCSV, { header: true }).data;
        const bairros = Papa.parse(bairrosCSV, { header: true }).data;

        const bairroMap = new Map(bairros.map(b => [b.bai_001, { name: b.bai_002, fee: parseFloat(b.bai_003) }]));

        const batch = db.batch();
        let customersCreated = 0;
        let deliveryFeesCreated = 0;

        // 1. Processar e criar Taxas de Entrega primeiro
        for (const [_, bairroInfo] of bairroMap.entries()) {
            const feeRef = doc(collection(db, 'users', targetBusinessId, 'deliveryFees'));
            batch.set(feeRef, {
                businessId: targetBusinessId,
                neighborhood: bairroInfo.name,
                fee: bairroInfo.fee
            });
            deliveryFeesCreated++;
        }

        // 2. Processar e criar Clientes com seus endereços
        for (const cliente of clientes) {
            const customerId = cliente.cli_001;
            if (!customerId || cliente.cli_002 === 'CONSUMIDOR FINAL') continue;

            const bairroInfo = bairroMap.get(cliente.bai_001);

            const localCustomerRef = doc(db, 'users', targetBusinessId, 'localCustomers', `migrated_${customerId}`);
            batch.set(localCustomerRef, {
                businessId: targetBusinessId,
                name: cliente.cli_002,
                phone: normalizePhoneNumber(cliente.celular1 || cliente.cli_012) || 'N/A',
                email: cliente.email || '',
                address: `${cliente.cli_004 || ''}, ${cliente.cli_009 || ''} - ${bairroInfo?.name || ''}`,
                notes: cliente.observacao || '',
                createdAt: serverTimestamp(),
                legacyId: customerId
            });
            customersCreated++;
        }

        await batch.commit();

        return {
            success: true,
            message: `Migração concluída! ${customersCreated} clientes e ${deliveryFeesCreated} taxas de entrega foram importados.`
        };

    } catch (error) {
        functions.logger.error("Erro na migração em lote:", error);
        throw new functions.https.HttpsError("internal", "Falha na migração dos dados.");
    }
});


// =================================================================
// === MOTOR DE MIGRAÇÃO PROMETHEUS (v2 - Final) ===
// =================================================================
exports.processAndMigrateLegacyData = onCall({
    enforceAppCheck: true, timeoutSeconds: 540, memory: '1GiB'
}, async (request) => {
    // --- PASSO 1: VERIFICAÇÃO DE PERMISSÃO CORRETA ---
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Autenticação necessária.");
    }
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(request.auth.uid).get();
    if (!userDoc.exists() || userDoc.data()?.role !== 'superadmin') {
        throw new functions.https.HttpsError("permission-denied", "Acesso negado. Apenas administradores.");
    }

    const { stage, targetBusinessId, filesData, mappings } = request.data;

    // --- ESTÁGIO DE ANÁLISE (O GAE) ---
    if (stage === 'analyze') {
        const analysis = { suggestions: {}, uniqueValues: {} };
        // A lógica de análise permanece a mesma, pois funcionou corretamente
        const clientesFile = filesData['clientes.csv'];
        if (clientesFile) {
            const parsed = Papa.parse(clientesFile, { header: true, skipEmptyLines: true, preview: 100 });
            analysis.suggestions['clientes.csv'] = {
                'cli_002': 'customer_name', 'celular1': 'customer_phone', 'cli_012': 'customer_phone',
                'email': 'customer_email', 'cli_004': 'address_street', 'cli_009': 'address_number',
                'cep_003': 'address_neighborhood', 'observacao': 'customer_notes',
            };
        }
        const bairrosFile = filesData['bairro.csv'];
        if (bairrosFile) {
            const parsed = Papa.parse(bairrosFile, { header: true, skipEmptyLines: true });
            analysis.suggestions['bairro.csv'] = {
                'bai_002': 'delivery_fee_name', 'bai_003': 'delivery_fee_price',
            };
            const uniqueBairros = [...new Set(parsed.data.map(row => row.bai_002.trim()))].filter(Boolean);
            analysis.uniqueValues['bairros'] = uniqueBairros;
        }
        // Análise de outros arquivos (produtos, etc.) viria aqui...
        return { success: true, analysis };
    }

    // --- ESTÁGIO DE EXECUÇÃO (O BIG BANG RELACIONAL) ---
    if (stage === 'execute') {
        const { columnMapping, valueMapping } = mappings;

        // Parse de todos os arquivos relevantes
        const clientesData = Papa.parse(filesData['clientes.csv'], { header: true, skipEmptyLines: true }).data;
        const bairrosData = Papa.parse(filesData['bairro.csv'], { header: true, skipEmptyLines: true }).data;
        const produtosData = Papa.parse(filesData['materiais.csv'], { header: true, skipEmptyLines: true }).data;
        const vendasData = Papa.parse(filesData['venda.csv'], { header: true, skipEmptyLines: true }).data;
        const vendaItensData = Papa.parse(filesData['vendaitem.csv'], { header: true, skipEmptyLines: true }).data;

        const batch = db.batch();
        let counters = { customers: 0, deliveryFees: 0, products: 0, sales: 0 };

        // --- TECELÃO RELACIONAL: Mapas de Tradução em Memória ---
        const legacyIdToNewId = {
            customers: new Map(),
            products: new Map(),
            deliveryFees: new Map(),
        };

        // 1. Processar Bairros -> Taxas de Entrega
        for (const bairro of bairrosData) {
            const feeRef = db.collection('users').doc(targetBusinessId).collection('deliveryFees').doc();
            const newName = valueMapping.bairros[bairro.bai_002.trim()] || bairro.bai_002.trim();
            batch.set(feeRef, {
                businessId: targetBusinessId,
                neighborhood: newName,
                fee: parseFloat(bairro.bai_003) || 0,
            });
            legacyIdToNewId.deliveryFees.set(bairro.bai_001, feeRef.id);
            counters.deliveryFees++;
        }

        // 2. Processar Clientes
        for (const cliente of clientesData) {
            if (cliente.cli_002 === 'CONSUMIDOR FINAL' || !cliente.cli_001) continue;
            const customerRef = db.collection('users').doc(targetBusinessId).collection('localCustomers').doc();
            batch.set(customerRef, {
                businessId: targetBusinessId,
                name: cliente.cli_002.trim(),
                phone: normalizePhoneNumber(cliente.celular1 || cliente.cli_012),
                legacyId: cliente.cli_001,
                createdAt: FieldValue.serverTimestamp(),
                //... outros campos mapeados
            });
            legacyIdToNewId.customers.set(cliente.cli_001, customerRef.id);
            counters.customers++;
        }

        // 3. Processar Materiais -> Produtos
        for (const produto of produtosData) {
            const productRef = db.collection('products').doc();
            batch.set(productRef, {
                businessId: targetBusinessId,
                name: produto.mat_003.trim(),
                salePrice: parseFloat(produto.mat_008) || 0,
                costPrice: parseFloat(produto.mat_006) || 0,
                productStructure: 'simples',
                showInCatalog: true,
                legacyId: produto.mat_001,
            });
            legacyIdToNewId.products.set(produto.mat_001, productRef.id);
            counters.products++;
        }

        // 4. Processar Vendas e seus Itens (O CORAÇÃO DA IA)
        for (const venda of vendasData) {
            const newCustomerId = legacyIdToNewId.customers.get(venda.cli_001);
            if (!newCustomerId) continue; // Pula vendas de "CONSUMIDOR FINAL" ou clientes não encontrados

            const saleRef = db.collection('sales').doc();
            const itemsParaVenda = vendaItensData
                .filter(item => item.ven_001 === venda.ven_001)
                .map(item => {
                    const newProductId = legacyIdToNewId.products.get(item.mat_001);
                    const productData = produtosData.find(p => p.mat_001 === item.mat_001);
                    return {
                        productId: newProductId || null,
                        name: productData?.mat_003.trim() || 'Produto Desconhecido',
                        qty: parseInt(item.ite_002, 10) || 0,
                        salePrice: parseFloat(item.ite_003) || 0,
                        legacyId: item.mat_001,
                    };
                })
                .filter(item => item.qty > 0);

            if (itemsParaVenda.length === 0) continue;

            batch.set(saleRef, {
                businessId: targetBusinessId,
                customerId: newCustomerId,
                totalAmount: parseFloat(venda.ven_009) || 0,
                date: new Date(venda.ven_004).toISOString(),
                createdAt: new Date(venda.ven_004),
                origin: 'migrado',
                status: 'completed',
                items: itemsParaVenda,
                legacyId: venda.ven_001,
            });
            counters.sales++;
        }

        await batch.commit();

        return {
            success: true,
            message: `Universo Recriado! ${counters.customers} clientes, ${counters.deliveryFees} taxas, ${counters.products} produtos e ${counters.sales} vendas foram assimilados.`
        };
    }

    throw new functions.https.HttpsError("invalid-argument", "Estágio de migração inválido.");
});

/**
 * Cria um pedido com um ID numérico sequencial para um negócio específico.
 * Esta função utiliza uma transação para garantir que o contador de pedidos
 * seja incrementado de forma atômica, evitando números duplicados.
 */
exports.createOrderWithSequentialId = onCall(async (request) => {
    // Validação de autenticação
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "A autenticação é necessária.");
    }

    const { orderData } = request.data;
    const businessId = orderData.businessId;
    const customerAuthId = orderData.customerId; // ID do cliente vindo do front-end
    const finalAmount = orderData.finalAmount || 0; // Valor final do pedido
    const uid = request.auth.uid; // UID de quem está criando o pedido

    if (!businessId) {
        throw new functions.https.HttpsError("invalid-argument", "O ID do negócio é obrigatório.");
    }

    // (Opcional, mas recomendado) Adicionar uma verificação para garantir que o 'uid'
    // tem permissão para criar pedidos para o 'businessId'.

    // ✅ PASSO 1: Obter a referência para o documento do cliente local, se houver um ID
    // const customerRef = customerAuthId ? db.collection('users').doc(businessId).collection('localCustomers').doc(customerAuthId) : null;

    const db = getFirestore();
    const businessRef = db.collection('users').doc(businessId);
    const orderRef = db.collection('orders').doc(); // Gera um ID único para o documento

    try {
        const newOrderData = await db.runTransaction(async (transaction) => {
            const businessDoc = await transaction.get(businessRef);
            if (!businessDoc.exists) {
                // Usando 'throw new Error' dentro de uma transação a cancela automaticamente.
                throw new Error("Perfil do negócio não encontrado!");
            }

            // Pega o contador atual ou inicia em 0 se não existir
            const currentCounter = businessDoc.data().orderCounter || 0;
            const newCounter = currentCounter + 1;

            if (customerAuthId) {
                // Procura pelo cliente na subcoleção 'localCustomers' usando o ID de autenticação
                const localCustomersColRef = db.collection('users').doc(businessId).collection('localCustomers');
                const customerQuery = localCustomersColRef.where('customerId', '==', customerAuthId).limit(1);

                // Executa a query dentro da transação
                const customerQuerySnapshot = await transaction.get(customerQuery);

                if (!customerQuerySnapshot.empty) {
                    const localCustomerDoc = customerQuerySnapshot.docs[0];
                    functions.logger.info(`Atualizando estatísticas para o cliente local ${localCustomerDoc.id} no negócio ${businessId}.`);

                    transaction.update(localCustomerDoc.ref, {
                        orderCount: FieldValue.increment(1),
                        totalSpent: FieldValue.increment(finalAmount),
                        lastOrderDate: FieldValue.serverTimestamp()
                    });
                } else {
                    functions.logger.warn(`Cliente local com customerId (auth UID) ${customerAuthId} não encontrado para o negócio ${businessId}. As estatísticas não serão atualizadas.`);
                }
            }

            // Monta o objeto final do pedido
            const finalOrderData = {
                ...orderData,
                id: orderRef.id, // O ID do documento continua sendo o do Firestore
                orderNumber: newCounter, // Este é o nosso novo ID sequencial e legível
                createdAt: FieldValue.serverTimestamp(), // Garante o timestamp do servidor
                createdBy: uid, // Rastreia quem criou o pedido
            };

            // Agenda as operações de escrita na transação
            transaction.set(orderRef, finalOrderData);
            transaction.update(businessRef, { orderCounter: newCounter });

            return finalOrderData;
        });

        console.log(`Pedido #${newOrderData.orderNumber} criado com sucesso para o negócio ${businessId}.`);
        return { success: true, order: newOrderData };

    } catch (error) {
        console.error("Falha na transação de criação de pedido: ", error);
        throw new functions.https.HttpsError("internal", "Falha ao criar o pedido.", error);
    }
});

exports.finalizeSale = onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "A autenticação é necessária.");
    }

    const { orderData } = request.data;
    functions.logger.info("Iniciando finalizeSale com os dados:", { orderData });

    const { id: orderId, tableId, businessId, customerId, finalAmount } = orderData;

    if (!businessId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do negócio é obrigatório.");
    }

    const db = getFirestore();
    const businessRef = db.collection('users').doc(businessId);

    try {
        // ✅ PADRÃO CORRIGIDO: A transação agora retorna os dados da venda.
        const saleDataFromTransaction = await db.runTransaction(async (transaction) => {
            functions.logger.info(`Iniciando transação para o negócio: ${businessId}`);

            const businessDoc = await transaction.get(businessRef);
            if (!businessDoc.exists) throw new Error("Negócio não encontrado!");

            const currentSaleCounter = businessDoc.data().orderCounter || 0;
            const newSaleNumber = currentSaleCounter + 1;

            const saleRef = db.collection('sales').doc();

            const saleData = {
                ...orderData,
                orderNumber: newSaleNumber,
                finishedAt: FieldValue.serverTimestamp(),
                status: 'completed'
            };

            transaction.set(saleRef, saleData);
            transaction.update(businessRef, { orderCounter: newSaleNumber });

            if (orderId) {
                const orderRef = db.collection('orders').doc(orderId);
                transaction.delete(orderRef);
            }

            if (tableId) {
                const tableRef = db.collection('tables').doc(tableId);
                transaction.update(tableRef, { status: 'livre', currentOrderId: null });
            }

            if (customerId) {
                const localCustomersColRef = db.collection('users').doc(businessId).collection('localCustomers');
                const customerQuery = localCustomersColRef.where('customerId', '==', customerId).limit(1);

                const customerQuerySnapshot = await transaction.get(customerQuery);

                if (!customerQuerySnapshot.empty) {
                    const localCustomerDoc = customerQuerySnapshot.docs[0];
                    transaction.update(localCustomerDoc.ref, {
                        orderCount: FieldValue.increment(1),
                        totalSpent: FieldValue.increment(finalAmount || 0),
                        lastOrderDate: FieldValue.serverTimestamp()
                    });
                } else {
                    functions.logger.warn(`Nenhum cliente local encontrado com customerId: ${customerId}`);
                }
            }

            // ✅ A transação retorna os dados da venda para fora do seu escopo.
            return saleData;
        });

        functions.logger.info(`Venda finalizada com sucesso para o negócio ${businessId}.`);
        // ✅ A variável agora existe e tem o valor correto.
        return { success: true, sale: saleDataFromTransaction };

    } catch (error) {
        functions.logger.error("Erro CRÍTICO durante a transação de finalizeSale:", {
            errorMessage: error.message,
            errorStack: error.stack,
            orderData: orderData,
        });
        throw new functions.https.HttpsError("internal", "Falha ao finalizar a venda.", { detailedError: error.message });
    }
});

exports.processComandaScan = onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "A autenticação é necessária.");
    }

    const { imageData, layoutId } = request.data;
    if (!imageData) {
        throw new functions.https.HttpsError("invalid-argument", "A imagem da comanda é obrigatória.");
    }

    functions.logger.info(`Recebido scan de comanda real com layout: ${layoutId}`);

    // Cria um cliente para a API Vision
    const client = new vision.ImageAnnotatorClient();

    // Remove o cabeçalho 'data:image/jpeg;base64,' para enviar apenas os dados da imagem
    const imageBuffer = Buffer.from(imageData.split(',')[1], 'base64');

    try {
        // Usa a IA para detetar todo o texto na imagem
        const [result] = await client.textDetection(imageBuffer);
        const detections = result.textAnnotations;

        if (!detections || detections.length === 0) {
            throw new Error("Nenhum texto foi detetado na imagem.");
        }

        // A primeira deteção é o texto completo, o resto são palavras individuais com as suas posições
        const allText = detections[0].description;
        functions.logger.info("Texto extraído da comanda:", allText);

        // --- LÓGICA NEXUS DE INTERPRETAÇÃO (A SER REFINADA) ---
        // Aqui, iríamos buscar o 'layoutId' no banco de dados, obter as posições
        // dos checkboxes e cruzar com as posições das palavras "X" ou marcas detetadas.

        // Por agora, vamos simular que encontramos estes itens no texto
        const mockedPedido = {
            items: [
                { name: "Espaguete", type: "massa", price: 0, quantity: 1, observation: "" },
                { name: "Molho Pesto", type: "molho", price: 0, quantity: 1, observation: "" },
                { name: "Bacon", type: "ingrediente_pago", price: 4.50, quantity: 1, observation: "" },
            ],
            total: 4.50
        };

        return { success: true, pedido: mockedPedido, detectedText: allText };

    } catch (error) {
        functions.logger.error("Erro na API Google Cloud Vision:", error);
        throw new functions.https.HttpsError("internal", "Falha ao analisar a imagem da comanda.", error);
    }
});


/**
 * Função utilitária para enviar atualizações de status para o Firestore.
 * Isso permite que o frontend (seu painel) saiba o que está acontecendo.
 */
const updateConnectionStatus = async (businessId, connectionId, status, data = {}) => {
    const connectionRef = db.collection("users").doc(businessId).collection("whatsapp_connections").doc(connectionId);
    await connectionRef.update({ status, ...data });
};

/**
 * Cria e inicializa uma nova sessão do WhatsApp.
 */
const createWhatsappClient = (businessId, connectionId) => {
    console.log(`[${connectionId}] Criando nova sessão...`);

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: connectionId }),
        puppeteer: {
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--single-process",
                "--disable-gpu",
            ],
        },
    });

    client.on("qr", async (qr) => {
        console.log(`[${connectionId}] QR Code recebido.`);
        await updateConnectionStatus(businessId, connectionId, "connecting", {
            qrCode: qr,
            lastStatus: "QR Code gerado. Escaneie com seu celular.",
        });
    });

    client.on("ready", async () => {
        console.log(`[${connectionId}] Cliente está pronto!`);
        const clientInfo = client.info;
        await updateConnectionStatus(businessId, connectionId, "connected", {
            phoneNumber: clientInfo.wid.user,
            lastStatus: "Conectado com sucesso.",
            qrCode: null, // Limpa o QR code
        });
    });

    client.on("auth_failure", async (msg) => {
        console.error(`[${connectionId}] Falha na autenticação:`, msg);
        await updateConnectionStatus(businessId, connectionId, "error", {
            lastStatus: "Falha na autenticação. Tente novamente.",
        });
        delete sessions[connectionId]; // Remove a sessão com falha
    });

    client.on("disconnected", async (reason) => {
        console.log(`[${connectionId}] Cliente foi desconectado:`, reason);
        await updateConnectionStatus(businessId, connectionId, "disconnected", {
            lastStatus: "Desconectado. Reconecte para continuar.",
        });
        delete sessions[connectionId]; // Remove a sessão da memória
    });

    // *** OUVINDO MENSAGENS - A MÁGICA ACONTECE AQUI ***
    client.on("message", async (msg) => {
        console.log(`[${connectionId}] MENSAGEM RECEBIDA DE:`, msg.from, "MENSAGEM:", msg.body);
        // TODO na PRÓXIMA FASE: Salvar a mensagem no Firestore e implementar a lógica do robô.
    });

    client.initialize().catch(err => {
        console.error(`[${connectionId}] Erro na inicialização: `, err);
        updateConnectionStatus(businessId, connectionId, "error", {
            lastStatus: "Erro crítico ao inicializar. Contate o suporte.",
        });
    });

    sessions[connectionId] = client;
    return client;
};

// --- NOSSAS CLOUD FUNCTIONS ---

/**
 * [CHAMADA PELO FRONTEND]
 * Inicia uma nova sessão de WhatsApp, cria o documento no Firestore e dispara a geração do QR Code.
 */
exports.startWhatsappSession = functions.https.onCall(async (data, context) => {
    const { businessId, nickname } = data;

    // Validação
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Você precisa estar logado.");
    }
    if (!businessId || !nickname) {
        throw new functions.https.HttpsError("invalid-argument", "Faltam informações essenciais.");
    }

    // Cria o registro da conexão no Firestore
    const connectionRef = db.collection("users").doc(businessId).collection("whatsapp_connections").doc();
    await connectionRef.set({
        nickname,
        status: "connecting",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastStatus: "Iniciando sessão no servidor...",
    });

    // Inicia o cliente de WhatsApp para esta nova conexão
    createWhatsappClient(businessId, connectionRef.id);

    return { success: true, connectionId: connectionRef.id };
});

/**
 * [CHAMADA PELO FRONTEND]
 * Desconecta uma sessão ativa do WhatsApp.
 */
exports.logoutWhatsappSession = functions.https.onCall(async (data, context) => {
    const { businessId, connectionId } = data;

    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Você precisa estar logado.");
    }

    const client = sessions[connectionId];
    if (client) {
        await client.logout(); // O evento 'disconnected' cuidará de atualizar o status
        delete sessions[connectionId];
        return { success: true, message: "Sessão desconectada." };
    } else {
        // Se a sessão não estiver na memória, força a atualização no DB
        await updateConnectionStatus(businessId, connectionId, "disconnected", {
            lastStatus: "Desconectado manualmente."
        });
        return { success: true, message: "Sessão não encontrada na memória, status atualizado." };
    }
});

/**
 * Gera um código de loteria único para um CLIENTE LOCAL (por estabelecimento).
 * Esta função é 'onCall' e deve ser chamada pelo dono do negócio.
 */
exports.generateLocalLotteryCode = onCall(async (request) => {
    const data = request.data;
    const auth = request.auth;

    // 1. Autenticação
    if (!auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "Você precisa estar logado para executar esta ação."
        );
    }

    const { businessId, localCustomerId } = data;

    if (!businessId || !localCustomerId) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "businessId e localCustomerId são obrigatórios."
        );
    }

    // 2. Autorização
    const callerUid = auth.uid;
    const userDoc = await admin.firestore().collection("users").doc(callerUid).get();
    if (userDoc.data()?.businessId !== businessId && userDoc.id !== businessId) {
        throw new functions.https.HttpsError(
            "permission-denied",
            "Você não tem permissão para alterar este negócio."
        );
    }

    // 3. Caminho para o cliente local
    const localCustomerRef = admin
        .firestore()
        .collection("users")
        .doc(businessId)
        .collection("localCustomers")
        .doc(localCustomerId);

    const localCustomerDoc = await localCustomerRef.get();
    if (!localCustomerDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Cliente local não encontrado.");
    }
    
    if (localCustomerDoc.data()?.lotteryCode) {
        throw new functions.https.HttpsError(
            "already-exists",
            "Este cliente já possui um número da sorte neste estabelecimento."
        );
    }

    // 4. Geração de Código Único (LOCAL)
    let uniqueCode = "";
    let isUnique = false;
    const localCustomersCollection = admin
        .firestore()
        .collection("users")
        .doc(businessId)
        .collection("localCustomers");

    // Loop de segurança para garantir unicidade
    let attempts = 0;
    while (!isUnique && attempts < 10) {
        uniqueCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        const snapshot = await localCustomersCollection
            .where("lotteryCode", "==", uniqueCode)
            .limit(1)
            .get();
        
        if (snapshot.empty) {
            isUnique = true;
        }
        attempts++;
    }
    
    // 5. Salvar no Perfil do Cliente LOCAL
    try {
        await localCustomerRef.update({
            wantsToParticipateInDraws: true,
            lotteryCode: uniqueCode,
        });

        return {
            success: true,
            message: "Código da sorte gerado com sucesso!",
            lotteryCode: uniqueCode,
        };
    } catch (error) {
        console.error("Erro ao salvar código no perfil local:", error);
        throw new functions.https.HttpsError(
            "internal",
            "Não foi possível salvar o código do cliente. Tente novamente."
        );
    }
});