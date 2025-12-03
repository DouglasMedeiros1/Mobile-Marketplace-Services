// User Types
export interface User {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  bio?: string;
  rating?: number;
  disponivel_servico_rapido: boolean;
  roles: string[];
  created_at: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  bio?: string;
  role: 'cliente' | 'prestador';
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  recovery_code: string;
  new_password: string;
}

// Service Types
export interface Service {
  id: number;
  nome: string;
  descricao?: string;
  valor_minimo: number;
  valor_maximo: number;
  data_inicio?: string;
  data_fim: string;
  local?: string;
  user_id: number;
  metodo_pagamento?: string;
  category_id: number;
  status?: string;
  quick: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateServiceRequest {
  nome: string;
  descricao?: string;
  valor_minimo: number;
  valor_maximo: number;
  data_inicio?: string;
  data_fim: string;
  local?: string;
  metodo_pagamento?: string;
  category_id: number;
}

export interface UpdateServiceRequest {
  nome?: string;
  descricao?: string;
  valor_minimo?: number;
  valor_maximo?: number;
  data_inicio?: string;
  data_fim?: string;
  local?: string;
  metodo_pagamento?: string;
  category_id?: number;
}

// Proposal Types
export interface Proposal {
  id: number;
  service_id: number;
  prestador_id: number;
  valor: number;
  mensagem?: string;
  status: 'aberto' | 'aceito' | 'recusado' | 'cancelado';
  created_at: string;
  updated_at?: string;
}

export interface CreateProposalRequest {
  service_id: number;
  valor: number;
  mensagem?: string;
}

export interface UpdateProposalRequest {
  valor?: number;
  mensagem?: string;
}

export interface UpdateProposalStatusRequest {
  status: 'aberto' | 'aceito' | 'recusado' | 'cancelado';
}

// Chat Types
export interface ChatMessage {
  id: number;
  senderId: number;
  senderNome: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatRoom {
  clienteId: number;
  prestadorId: number;
  clienteNome: string;
  prestadorNome: string;
  createdAt: string;
  unreadCount: number;
  lastMessage?: {
    message: string;
    createdAt: string;
  };
  // Helper properties (computed on frontend based on current user role)
  otherUserId?: number;
  otherUserName?: string;
}

export interface ChatConversation {
  clienteId: number;
  prestadorId: number;
  clienteNome: string;
  prestadorNome: string;
  messages: ChatMessage[];
}

export interface SendMessageRequest {
  otherUserId: number;
  message: string;
}

// Quick Service Types
export interface QuickServiceAvailability {
  disponivel: boolean;
  lat?: number;
  lon?: number;
  categoryIds?: number[];
}

export interface QuickServiceRequest {
  lat: number;
  lon: number;
  categoryId: number;
  descricao?: string;
  valorMinimo: number;
}

export interface QuickServiceResponse {
  success: boolean;
  serviceId?: number;
  prestadorId?: number;
  prestadorNome?: string;
  message?: string;
}

// WebSocket Message Types
export interface WSMessage {
  type: string;
  [key: string]: any;
}

export interface WSConnectedMessage extends WSMessage {
  type: 'connected';
  userId: number;
  userName: string;
  message: string;
}

export interface WSNewMessageData extends WSMessage {
  type: 'new_message';
  data: ChatMessage;
}

export interface WSMessageSentData extends WSMessage {
  type: 'message_sent';
  data: ChatMessage;
}

export interface WSMarkedReadData extends WSMessage {
  type: 'marked_read';
  otherUserId: number;
}

export interface WSQuickServiceRequestData extends WSMessage {
  type: 'quick_service_request';
  requestId: string;
  clienteId: number;
  clienteNome: string;
  categoryId: number;
  categoriaNome: string;
  descricao?: string;
  valorMinimo: number;
  distanceMeters: number;
}

export interface WSQuickServiceMatchedData extends WSMessage {
  type: 'quick_service_matched';
  serviceId: number;
  prestadorId: number;
  prestadorNome: string;
}

export interface WSQuickServiceStartedData extends WSMessage {
  type: 'quick_service_started';
  serviceId: number;
  clienteId: number;
  clienteNome: string;
}

export interface WSErrorMessage extends WSMessage {
  type: 'error';
  message: string;
}

// WebSocket Message Type Guards
export const isConnectedMessage = (msg: WSMessage): msg is WSConnectedMessage => {
  return msg.type === 'connected';
};

export const isNewMessage = (msg: WSMessage): msg is WSNewMessageData => {
  return msg.type === 'new_message' && 'data' in msg;
};

export const isMessageSent = (msg: WSMessage): msg is WSMessageSentData => {
  return msg.type === 'message_sent' && 'data' in msg;
};

export const isMarkedRead = (msg: WSMessage): msg is WSMarkedReadData => {
  return msg.type === 'marked_read';
};

export const isQuickServiceRequest = (msg: WSMessage): msg is WSQuickServiceRequestData => {
  return msg.type === 'quick_service_request';
};

export const isQuickServiceMatched = (msg: WSMessage): msg is WSQuickServiceMatchedData => {
  return msg.type === 'quick_service_matched';
};

export const isQuickServiceStarted = (msg: WSMessage): msg is WSQuickServiceStartedData => {
  return msg.type === 'quick_service_started';
};

export const isErrorMessage = (msg: WSMessage): msg is WSErrorMessage => {
  return msg.type === 'error';
};

// Category Types
export interface Category {
  id: number;
  nome: string;
  descricao?: string;
}

// Dashboard Types
export interface ClienteDashboardResponse {
  userId: number;
  totalServicos: number;
  servicosAbertos: number;
  servicosEmAndamento: number;
  servicosConcluidos: number;
  servicosCancelados: number;
  totalPropostasRecebidas: number;
  propostasAceitas: number;
  valorTotalPropostasAceitas: number;
  avaliacaoMedia: number;
  valorMedioPorServico: number;
  servicosComProposta: number;
  servicosSemProposta: number;
  totalGasto: number;
}

export interface PrestadorDashboardResponse {
  userId: number;
  totalPropostasCriadas: number;
  propostasAbertas: number;
  propostasAceitas: number;
  propostasRejeitadas: number;
  propostasCanceladas: number;
  servicosFinalizados: number;
  servicosEmAndamento: number;
  valorTotalGanho: number;
  valorEmAndamento: number;
  avaliacaoMedia: number;
  taxaAceitacao: number;
  valorMedioPorServico: number;
  clientesAtendidos: number;
  categoriasMaisTrabalhadas: Array<{
    nome: string;
    quantidade: number;
  }>;
}

// API Error Response
export interface ApiError {
  error: string;
  message?: string;
  details?: any;
}
