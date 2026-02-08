export function withTimeout<T>(
    promise: Promise<T>,
    ms = 10000
): Promise<T> {

    return new Promise((resolve, reject) => {

        const timer = setTimeout(() => {
            reject(new Error('Database startup timeout'));
        }, ms);

        promise
            .then(value => {
                clearTimeout(timer);
                resolve(value);
            })
            .catch(err => {
                clearTimeout(timer);
                reject(err);
            });

    });
}
