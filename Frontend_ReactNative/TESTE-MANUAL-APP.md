# 📱 Guia de Teste Manual - Quick Service App

## ✅ Pré-requisitos

1. ✅ Backend rodando em `http://localhost:3000` (ou `http://10.0.2.2:3000` para Android)
2. ✅ Banco de dados populado com prestador de teste
3. ✅ Metro bundler rodando (`npm start`)
4. ✅ App instalado no emulador/dispositivo

---

## 🧪 Teste 1: Configurar Prestador

### Passo 1: Login como Prestador
1. Abra o app
2. Se já logado, faça logout primeiro
3. Na tela de Login:
   - **Email:** `joao@example.com`
   - **Senha:** `senha123`
4. Clique em **Entrar**

### Passo 2: Navegar para Quick Service
1. Após login, você verá as abas na parte inferior
2. Clique na aba **"Rápido"** (ícone de raio ⚡)
3. Você verá a tela inicial do Quick Service

### Passo 3: Ativar Disponibilidade
1. Na tela inicial, clique em **"Gerenciar Disponibilidade"**
2. Você verá a tela de configuração do prestador
3. **Obter localização GPS:**
   - Clique no botão **"Usar Minha Localização (GPS)"** (azul)
   - Permita o acesso à localização quando solicitado
   - Aguarde alguns segundos enquanto obtém sua localização
   - Os campos Latitude e Longitude serão preenchidos automaticamente
   
   **OU manualmente:**
   - **Latitude:** `-23.550520`
   - **Longitude:** `-46.633308`
   
4. **Categorias:** Selecione **"Limpeza"** (clique no chip para selecionar)
5. **Toggle "Disponível para Atendimento":** Ative (deslize para verde)
6. Se você é o usuário ID 5, verá também:
   - **Toggle "🤖 Auto-Aceitar (Teste)":** Ative para aceitar automaticamente
7. Clique em **"Salvar Disponibilidade"**

### ✅ Resultado Esperado:
- Alert de "Sucesso - Você está disponível para serviços rápidos!"
- Badge no topo: **"Conectado"** (verde)
- Toggle de disponibilidade: **Verde**

### ⚠️ Se der erro:
- Verifique se o backend está rodando
- Verifique o `.env`: `API_BASE_URL=http://10.0.2.2:3000` (Android) ou `http://localhost:3000` (iOS)
- Verifique se o WebSocket está conectado (badge verde)

---

## 🧪 Teste 2: Solicitar Serviço como Cliente

### Passo 1: Criar/Login como Cliente
**Opção A: Registrar novo cliente**
1. Na tela de Login, clique em **"Registrar-se"**
2. Preencha:
   - **Nome:** Seu nome
   - **Email:** seu@email.com
   - **CPF:** 12345678900
   - **Senha:** 123456
   - **Role:** Selecione **"Cliente"**
3. Clique em **"Registrar"**

**Opção B: Usar cliente existente**
1. Faça logout do prestador
2. Login com email de cliente

### Passo 2: Navegar para Quick Service
1. Clique na aba **"Rápido"** ⚡
2. Clique em **"Solicitar Serviço Rápido"**

### Passo 3: Preencher Solicitação
1. **Obter localização GPS:**
   - Clique no botão **"Usar Minha Localização (GPS)"** (azul)
   - Permita o acesso à localização quando solicitado
   - Aguarde enquanto obtém sua localização
   - Os campos serão preenchidos automaticamente
   
   **OU manualmente:**
   - **Latitude:** `-23.550520` (MESMA do prestador)
   - **Longitude:** `-46.633308` (MESMA do prestador)
   
2. **Categoria:** Selecione **"Limpeza"** (MESMA do prestador)
3. **Descrição:** "Preciso de limpeza urgente" (opcional)
4. Clique em **"Buscar Prestador Agora"**

### ✅ Resultado Esperado:

**Se prestador está com auto-aceitar ATIVO:**
1. Tela de loading: "🔍 Procurando prestadores..."
2. Após ~2 segundos:
3. Modal de sucesso aparece:
   - "🎉 Prestador Encontrado!"
   - "João Técnico aceitou sua solicitação"
   - Botões: "Chat" e "Ver Serviço"
4. Clique em **"Ver Serviço"**
5. Navegação para tela de detalhes do serviço

**Se prestador está com auto-aceitar DESATIVADO:**
1. Tela de loading: "🔍 Procurando prestadores..."
2. No dispositivo do prestador:
   - Notificação sonora/visual (Alert)
   - Card de solicitação aparece com:
     - Nome do cliente
     - Categoria
     - Valor: R$ 50,00
     - Distância
     - Botões: **"Recusar"** e **"Aceitar"**
3. Prestador clica em **"Aceitar"**
4. No dispositivo do cliente:
   - Modal de sucesso aparece

### ❌ Se aparecer erro "Sem Prestadores":
Verifique:
1. Prestador está com disponibilidade ATIVA
2. Mesma categoria selecionada
3. Mesmas coordenadas (ou próximas)
4. WebSocket conectado em ambos os dispositivos
5. Coordenadas não expiraram (< 5 minutos desde ativação)

---

## 🧪 Teste 3: Verificar WebSocket em Tempo Real

### Teste com 2 Dispositivos/Emuladores:

**Dispositivo 1 - Prestador:**
1. Login como prestador
2. Ativar disponibilidade
3. **Deixar app ABERTO** na tela de Quick Service Prestador
4. Observar a seção "🔔 Solicitações Recebidas"

**Dispositivo 2 - Cliente:**
1. Login como cliente
2. Ir para Quick Service Cliente
3. Preencher e enviar solicitação

**Resultado:**
- Dispositivo 1 deve mostrar card de solicitação INSTANTANEAMENTE
- Ao aceitar, Dispositivo 2 recebe modal de sucesso

---

## 🧪 Teste 4: Cenários de Erro

### A. Sem Prestadores Disponíveis
1. Login como prestador
2. **DESATIVAR** disponibilidade (toggle OFF)
3. Login como cliente (outro dispositivo)
4. Solicitar serviço
5. **Esperado:** Alert "Nenhum prestador disponível na sua região"

### B. Categoria Diferente
1. Prestador ativa com categoria "Limpeza"
2. Cliente solicita categoria "Reparos"
3. **Esperado:** "Nenhum prestador disponível"

### C. WebSocket Desconectado
1. Desligar WiFi/dados no dispositivo
2. Observar badge: "Desconectado" (vermelho)
3. Reativar rede
4. **Esperado:** Badge volta para "Conectado" (verde) automaticamente

### D. Coordenadas Expiradas
1. Prestador ativa disponibilidade
2. Aguardar 6+ minutos SEM usar o app
3. Cliente solicita serviço
4. **Esperado:** "Nenhum prestador disponível"
5. Prestador deve reativar disponibilidade

---

## 📊 Debug e Logs

### No React Native Debugger / Console:

**Prestador recebe solicitação:**
```
📩 Received quick service request: {requestId, clienteNome, ...}
```

**Prestador aceita:**
```
✅ Accepting request: <requestId>
```

**Cliente recebe match:**
```
✅ Service matched: {serviceId, prestadorNome, ...}
```

### Verificar Estado do Backend:

Abra no navegador ou Postman:
```
GET http://localhost:3000/quick-service/debug/state
```

Retorna:
- `availablePrestadores`: Quantos prestadores disponíveis
- `activeClaims`: Matching em andamento
- `pendingRequests`: Solicitações aguardando resposta

---

## ✅ Checklist de Teste Completo

- [ ] Prestador consegue fazer login
- [ ] Prestador pode usar GPS para obter localização
- [ ] Prestador pode inserir coordenadas manualmente
- [ ] Prestador consegue ativar disponibilidade
- [ ] Badge WebSocket mostra "Conectado"
- [ ] Cliente consegue fazer login
- [ ] Cliente pode usar GPS para obter localização
- [ ] Cliente pode inserir coordenadas manualmente
- [ ] Cliente consegue solicitar serviço
- [ ] Prestador recebe notificação em tempo real
- [ ] Prestador pode aceitar solicitação
- [ ] Cliente recebe confirmação de match
- [ ] Modal de sucesso aparece
- [ ] Navegação para serviço funciona
- [ ] Prestador pode recusar solicitação
- [ ] Auto-aceitar funciona (usuário ID 5)
- [ ] Erro "sem prestadores" funciona corretamente
- [ ] WebSocket reconecta automaticamente
- [ ] Location refresh a cada 3 minutos (observar logs)

---

## 🔧 Troubleshooting

### "Erro ao obter localização" / "Permissão Negada"
- Verifique se você permitiu acesso à localização quando solicitado
- Android: Vá em Configurações > Apps > [App] > Permissões > Localização > Permitir
- iOS: Vá em Ajustes > Privacidade > Localização > [App] > Permitir
- Certifique-se de que o GPS está ativo no dispositivo

### "Localização indisponível"
- Ative o GPS/Localização no dispositivo
- Saia de ambientes fechados (GPS funciona melhor ao ar livre)
- Aguarde alguns segundos para o GPS se conectar aos satélites

### "Tempo esgotado ao obter localização"
- Tente novamente
- Verifique se está em área com boa recepção GPS
- Use entrada manual se GPS continuar falhando

### "Erro ao atualizar disponibilidade"
- Verifique token JWT válido
- Verifique conexão com backend
- Verifique se coordenadas são números válidos

### "WebSocket Desconectado"
- Verifique `WS_BASE_URL` no `.env`
- Android: Use `ws://10.0.2.2:3000`
- iOS: Use `ws://localhost:3000`
- Verifique se backend tem WebSocket habilitado

### "Busca infinita" (loading não para)
- Nenhum prestador aceitou em 30+ segundos
- Cancele a busca e tente novamente
- Verifique se prestador recebeu notificação

### App crashou
- Verifique logs no terminal do Metro
- Verifique erros no React Native Debugger
- Limpe cache: `npm start -- --reset-cache`

---

## 📝 Dados de Teste Prontos

**Prestador Teste:**
```
Email: joao@example.com
Senha: senha123
Coordenadas: -23.550520, -46.633308
Categorias: Limpeza, Reparos
```

**Cliente Teste:**
```
Email: maria.teste@example.com
Senha: senha123
(ou registre um novo)
```

**Coordenadas de São Paulo:**
```
Centro: -23.550520, -46.633308
Paulista: -23.561414, -46.656890
Vila Madalena: -23.546275, -46.690879
```

---

**Boa sorte nos testes! 🚀**

Se encontrar problemas, verifique:
1. Backend está rodando
2. WebSocket está conectado
3. Prestador tem disponibilidade ativa
4. Mesma categoria selecionada
5. Coordenadas válidas e não expiradas
