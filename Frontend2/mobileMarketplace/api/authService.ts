// api/authService.ts (Versão Final e Consolidada)
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://mobile-marketplace-server-1-0-sgvh.onrender.com/auth';
const USER_URL = 'https://mobile-marketplace-server-1-0-sgvh.onrender.com/users'; 

/**
 * Função utilitária CRUCIAL para ler o corpo da resposta de forma robusta.
 * Ela garante que a resposta é lida apenas uma vez e tenta analisar o JSON,
 * ou retorna uma mensagem clara de erro (seja JSON de erro ou HTML/texto).
 */
async function readResponse(response: Response) {
    // 1. LER O CORPO APENAS UMA VEZ COMO TEXTO (Fixa o erro "Already read")
    const responseText = await response.text(); 

    // --- Resposta OK (2xx) ---
    if (response.ok) {
        try {
            // Tenta analisar o texto lido como JSON
            return JSON.parse(responseText); 
        } catch (e) {
            // 204 No Content não retorna corpo, mas é sucesso
            if (response.status === 204) return {}; 
            
            console.error("Resposta de sucesso inesperada, não é JSON:", responseText.substring(0, 100));
            throw new Error("Resposta inesperada do servidor: Falha na leitura do JSON.");
        }
    } 
    // --- Resposta com Erro (4xx, 5xx) ---
    else {
        let errorMessage = `Falha na requisição com status: ${response.status}`;
        
        try {
            // Tenta analisar o texto de erro como JSON (erro esperado)
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorData.message || errorMessage;
            
        } catch (e) {
            // Se não for JSON (HTML/Texto de erro), usa o texto puro como mensagem
            console.error("Resposta de erro não é JSON. Server response:", responseText.substring(0, 100));
            errorMessage = responseText.substring(0, 100) || errorMessage; 
        }
        
        // Lança a mensagem de erro (JSON ou HTML/Texto)
        throw new Error(errorMessage);
    }
}


/**
 * Função Auxiliar - Usada para Rotas Protegidas (envia o token Bearer).
 */
async function fetchWithAuth(url: string, method: string = 'GET', body: any = null) {
    const token = await AsyncStorage.getItem('user_auth_token');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Anexa o token para rotas protegidas
    }

    const config: RequestInit = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(url, config);
    
    // Usa a função robusta para tratar o resultado
    return readResponse(response); 
}

// ------------------------------------------------------------------
// FUNÇÕES DE EXPORTAÇÃO (API)
// ------------------------------------------------------------------

/**
 * Faz o login e retorna token + dados do usuário.
 */
export async function login(email: string, password: string) {
    const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    // Usa a função robusta de leitura (agora é seguro)
    const data = await readResponse(response);
    return data; 
}


/**
 * Função para registrar um novo usuário no servidor.
 */
export async function register(userData: any) {
    const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });

    // Usa a função robusta de leitura (agora é seguro)
    const data = await readResponse(response);
    return data.user; // Retorna os dados do usuário registrado
}


/**
 * Pega os dados completos do usuário logado (Rota Protegida: /auth/me).
 */
export async function getUserMe() {
    return fetchWithAuth(`${BASE_URL}/me`);
}

/**
 * Atualiza os dados do usuário (Rota Protegida: /users/:id).
 */
export async function updateUser(userId: number, userData: any) {
    return fetchWithAuth(`${USER_URL}/${userId}`, 'PUT', userData);
}

/**
 * Faz o logout no servidor (Rota Protegida: /auth/logout).
 */
export async function logoutUser() {
    // Usamos await, mas não esperamos retorno de dados (o servidor só retorna mensagem)
    await fetchWithAuth(`${BASE_URL}/logout`, 'POST');
}

export async function createService(data: any) {
    // A função fetchWithAuth é a que envia o token no cabeçalho.
    return fetchWithAuth(
        `${BASE_URL}/services`, 
        'POST', 
        data
    ); 
}