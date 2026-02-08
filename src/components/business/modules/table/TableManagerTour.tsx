// src/components/business/modules/table/TableManagerTour.tsx

import React from 'react';
import Joyride, { Step, CallBackProps } from 'react-joyride';
import { TourTooltip } from '../../../ui/TourTooltip';

interface TableManagerTourProps {
  run: boolean;
  callback: (data: CallBackProps) => void;
  stepIndex: number;
  steps: Step[]; // Agora recebe os passos como propriedade
}

// <<< MUDANÇA 1: Exportando os passos para serem usados externamente >>>
export const mainPageSteps: Step[] = [
  {
    target: 'body',
    content: 'Bem-vindo ao Guia Interativo! Meu nome é Gourmet AI e vou te ajudar a lançar um pedido.',
    placement: 'center',
    title: 'Olá!',
  },
  {
    target: '.table-card-livre',
    content: 'Este é o mapa de mesas. As verdes estão livres. Vou selecionar a primeira para você.',
    title: '1. Mapa de Mesas',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '.table-card-livre.selected',
    content: 'Mesa selecionada! Agora, vou abrir a comanda para iniciarmos o pedido.',
    title: '2. Abrir a Comanda',
    placement: 'right',
  }
];

export const modalSteps: Step[] = [
    {
        target: '#product-search-input',
        content: 'Use este campo para lançar produtos. Digite o código e tecle Enter, ou digite o nome para buscar.',
        title: '3. Lançar Produtos',
        placement: 'bottom',
    },
    {
        target: '#finalize-order-button',
        content: 'Quando terminar de adicionar os itens, clique aqui para enviar o pedido para a cozinha.',
        title: '4. Enviar para a Cozinha',
        placement: 'top',
    },
    {
        target: '.table-action-footer',
        content: 'E quando o cliente quiser pagar, use estes botões para o fechamento. Simples, não é?',
        title: '5. Fechamento da Conta',
        placement: 'top',
    }
];


export const TableManagerTour: React.FC<TableManagerTourProps> = ({ run, callback, stepIndex, steps }) => {
  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      callback={callback}
      continuous
      scrollToFirstStep
      showProgress
      showSkipButton
      tooltipComponent={TourTooltip}
    />
  );
};