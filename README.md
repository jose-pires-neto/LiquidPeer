# LiquidPeer 💧 - Compartilhamento P2P Instantâneo no Navegador

O **LiquidPeer** é um aplicativo web moderno, minimalista e seguro para compartilhamento direto de arquivos de ponta a ponta (Peer-to-Peer) entre dispositivos, utilizando o navegador e sem a necessidade de servidores intermediários de armazenamento.

Inspirado na fluidez e simplicidade do *AirDrop* e no **Liquid Glass**, o projeto conta com uma interface premium baseada nos conceitos de **Liquid Glass (Vidro Líquido)**, com efeitos de refração de vidro físico, física de fluidos e transições responsivas de alta fidelidade.

---

## ✨ Funcionalidades Principais

- 🚀 **Transferência P2P Direta (WebRTC)**: Conexão direta criptografada entre dois dispositivos utilizando PeerJS. Seus arquivos não passam por nenhum servidor de terceiros.
- 📸 **Scanner de QR Code via Webcam**: Integração nativa de câmera utilizando a biblioteca `html5-qrcode` para conexão instantânea entre celulares e computadores.
- 🌊 **Animações de Fluidos Físicos (Liquid Animations)**:
  - **Tubo de Fluxo**: Um duto de vidro 3D onde bolhas líquidas flutuam indicando em tempo real o fluxo e o sentido da transferência.
  - **Progresso Ondulado**: Barras de progresso estilo frascos cilíndricos de vidro que se preenchem com ondas líquidas oscilantes em direções opostas.
- 📊 **Métricas de Rede em Tempo Real**: Cálculo preciso de velocidade de transferência (ex: MB/s) e estimativa de tempo restante (ETA).
- 🎨 **Estética Liquid Glass Premium**: Design minimalista e sóbrio em tons escuros de azul e branco translúcido, com bordas refratativas 3D e sombras volumétricas realistas.
- ♿ **Acessibilidade e SEO**: Desenvolvido com tags semânticas, controle estrito de foco, suporte a leitores de tela (`sr-only` labels) e metadados Open Graph.

---

## 🛠️ Tecnologias Utilizadas

- **Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Protocolo P2P**: [PeerJS](https://peerjs.com/) (WebRTC Data Channels)
- **Processamento de QR**: [html5-qrcode](https://github.com/mebjas/html5-qrcode)
- **Bundler**: [Vite](https://vite.dev/)
- **Ícones**: [Lucide React](https://lucide.dev/)

---

## ⚙️ Como Funciona por Baixo dos Panos

1. **Sinalização**: O **Host** gera um identificador de sala exclusivo de 6 caracteres e inicializa o Peer. Um servidor de sinalização do PeerJS apenas auxilia os dois dispositivos a se encontrarem inicialmente.
2. **Conexão Direta**: Uma vez estabelecido o contato (seja via leitura de QR Code ou digitação manual do código no **Client**), os Peers abrem um canal de dados direto WebRTC de ponta a ponta.
3. **Fragmentação de Arquivos**: Os arquivos selecionados são fatiados em blocos (chunks) binários estáveis de 16KB para garantir alta confiabilidade na entrega e baixo consumo de memória no navegador.
4. **Buffer & Download**: O receptor acumula as fatias binárias no buffer e reconstrói o arquivo localmente gerando um Blob pronto para download imediato.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

### 1. Clonar o Repositório
```bash
git clone https://github.com/jose-pires-neto/LiquidPeer.git
cd LiquidPeer
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Executar em Modo de Desenvolvimento
```bash
npm run dev
```
Abra o link `http://localhost:5173` no seu navegador. Abra duas abas ou escaneie o QR Code em outro dispositivo na mesma rede local para testar!

### 4. Compilar para Produção (Build)
```bash
npm run build
```
O build estático pronto para deploy será gerado no diretório `dist/`.

---

## 📄 Licença

Este projeto é de código aberto e está licenciado sob a licença MIT. Sinta-se livre para usar, modificar e distribuir.
