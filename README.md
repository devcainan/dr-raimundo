# Landing page — Dr. Raimundo Vinícius

Página única (one-page) de conversão para otorrinolaringologia e cirurgia plástica facial em Natal/RN.
HTML semântico + CSS puro (tokens em `:root`) + JavaScript vanilla. Sem build, sem dependências.

```
index.html
termos-e-privacidade.html
assets/css/styles.css
assets/js/main.js
assets/img/            (fotos reais entram aqui)
  background.png       fundo do hero — desktop (2752x1536)
  background-mobile.png fundo do hero — celular (1536x2752)
  logo.svg             marca usada no header (preta; invertida por CSS)
  background-logo.svg  marca esmaecida do hero (já vem recortada e borrada)
```

Para ver localmente, basta abrir `index.html` no navegador.

## Pendências antes de publicar

> **Atenção:** os blocos tracejados que marcavam estas pendências **foram retirados das páginas**
> para a apresentação ao cliente. Elas continuam abertas — esta tabela passou a ser o único
> registro delas. As classes `.ph` continuam no `styles.css`, então basta reinserir o markup
> para trazer os marcadores de volta.

| Onde | O que falta |
|---|---|
| Resultados | Tempo de pós-operatório dos casos 2 e 3 — as legendas hoje dizem só "Rinoplastia" |
| Resultados | Procedimento do caso 3 **inferido da imagem** ("Rinoplastia") — precisa do aval do médico |
| Depoimentos | **Decisão pendente**: os 3 textos vieram de avaliações públicas do Google, sem autorização individual — ver abaixo |
| FAQ | As 4 respostas estão escritas, mas **precisam do aval do médico** antes de publicar |
| FAQ | Confirmar se a seção permanece (não constava no briefing) — a nota interna que dizia isso foi removida da página |
| Termos | Se as conversas do WhatsApp vão para algum sistema de gestão e por quanto tempo ficam guardadas (itens 2.5 e 2.6) |
| `<head>` | `og:image` (1200×630) para compartilhamento — o comentário lembrete continua na linha 14 do `index.html` |

### Contato

WhatsApp **(84) 99634-9544** em quatro lugares: a seção `#contato`, o rodapé e mais dois na página
de termos (itens 2.1 e 3, com `?text=` próprio — assunto de dados pessoais, não agendamento). O link é
`https://wa.me/5584996349544` com `?text=` trazendo a mensagem "Olá! Gostaria de agendar uma
avaliação." já digitada para o paciente — para tirar, basta apagar a query dos dois links.

O link do Google Maps é o que veio do cliente, inteiro, com os parâmetros `sa`/`ved` de sessão
de busca. Funciona, mas se um dia falhar, a parte estável é o identificador
`1s0x7b3001a940f4877:0xddf128d4c06a6c49`. Nos atributos `href` os `&` estão escritos como
`&amp;`, que é o que o HTML exige — o navegador resolve de volta para `&`.

O endereço saiu do próprio link: **Otoclínica — Av. Rodrigues Alves, 1129, Tirol, Natal/RN,
59020-200**. O Maps é renderizado por JavaScript, então buscar a página crua não devolve nada;
foi preciso abrir o link num navegador de verdade (Playwright) e ler o `[data-item-id="address"]`.

### Depoimentos

Os três textos são **avaliações públicas reais** da ficha do consultório no Google
(`maps?cid=1787938085292767872`, 4,8 com 19 avaliações na data em que foram colhidas). Foram
lidos renderizando a ficha, não escritos por nós.

- **Nomes reduzidos a primeiro nome + inicial** ("Eugênia R."). No Google eles aparecem por
  extenso, mas ali quem publicou foi o próprio paciente; aqui é o consultório afirmando que
  aquela pessoa operou com ele. Se houver autorização, é uma linha para voltar ao nome completo.
- **Um dos três é recorte**, marcado com `[…]` — o original citava também um lifting facial, que
  não é procedimento listado no site. Os outros dois estão na íntegra, inclusive com os
  desvios de digitação do original, que não foram corrigidos.
- A linha de abertura da seção foi trocada: dizia "publicados apenas com autorização expressa",
  o que deixaria de ser verdade. Agora diz de onde vieram, com link para a ficha.

**Duas questões seguem abertas e não são de código:** se republicar avaliação do Google no site
exige autorização do paciente, e o que as normas de publicidade médica do CFM permitem em
matéria de depoimento. Ambas precisam passar pelo jurídico antes de publicar.

### Formato dos casos antes/depois

Os três casos vieram como **uma imagem só**, em 4:5, com antes e depois empilhados no próprio
arquivo. Por isso **não existe mais comparador de arrastar** na página: o CSS do `.ba__frame`
e companhia saiu, e o bloco de JS que o movia também. Cada caso é um `.ba--single`.

- `antes-e-depois-1.jpg` — 320x400. É o único de resolução baixa; os painéis se encostam sem
  separação, então ele leva `.ba__plate--rule`, que desenha a régua no meio. Vale pedir um
  export maior, do tamanho dos outros dois.
- `antes-e-depois-2.jpg` e `-3.jpg` — 1080x1350. Já trazem a separação desenhada (faixa branca
  no 2, faixa preta diagonal no 3), então **não** levam `.ba__plate--rule` — a régua cairia por
  cima da foto, e no 3 nem no lugar certo, já que a divisão é diagonal e fora do meio.

Sobre a ordem dos painéis: no caso 2 os pontos cirúrgicos identificam qual é o pós-operatório,
e o `alt` diz isso. Nos casos 1 e 3 não dá para saber pela imagem, e o `alt` foi escrito
descrevendo os dois painéis **sem afirmar** qual é antes e qual é depois. Confirmar com o médico
antes de rotular.

### Ao inserir as fotos

Substituir cada `<div class="ph ...">` por um `<img>` com `alt` descritivo. Usar
`loading="lazy"` em todas, **exceto** a do hero, que deve carregar imediatamente.

### Formulário

O destino está resolvido: **o formulário abre o WhatsApp**. Nome e a mensagem opcional
são montados em texto e viram uma `wa.me/<numero>?text=`, aberta em nova aba. Não há servidor no
meio — quem envia é o paciente, do aparelho dele, e nada trafega nem fica gravado no site.

- **Não há campo de telefone**: no WhatsApp o número do remetente já aparece, e como nada fica
  gravado no site o campo seria coletado e descartado. O nome fica, porque o consultório não tem
  o paciente salvo na agenda e veria só um número.
- O número do consultório mora no HTML, em `data-whatsapp` no `<form>`, junto das outras ocorrências dele.
- **O formulário não é limpo depois do envio**, de propósito: se o navegador bloquear a nova aba,
  o que a pessoa escreveu continua ali, e a mensagem de status vira um link manual para a conversa.
- O texto da mensagem é montado com `encodeURIComponent`, então acento, quebra de linha e
  qualquer caractere que a pessoa digitar passam intactos.
- Isso mudou o que a política de privacidade precisa dizer, e ela já foi ajustada: os dados não
  saem do navegador até a pessoa apertar enviar dentro do WhatsApp.

## Decisões que não devem ser alteradas sem combinar

- **Dois verbos de ação apenas**: "Agendar avaliação" e "Solicitar avaliação" (envio do
  formulário). Não introduzir "Saiba mais", "Fale conosco" e afins.
- **O CTA do hero abre o WhatsApp direto**, a pedido do cliente — não rola mais até `#contato`.
  Por isso a seta dele aponta para cima-direita (sai do site) e não mais para baixo-esquerda
  (rolar a página): a diagonal é a única pista visual de para onde o botão leva. Quem quiser o
  formulário chega por "Contato" no menu. Consequência a acompanhar: o formulário perdeu a porta
  de entrada principal, então **a medição no GTM passa a ser a única forma de saber se ele ainda
  é usado**.
- **Cores só via tokens** de `:root` em `styles.css`. Nenhum hex ou `rgba()` solto no restante
  do arquivo.
- **Nenhum depoimento fictício.** Os blocos são placeholders justamente para não haver
  falso testemunho médico.
- **Sem preços** nos cards de procedimento.
- **Números reais**: CRM/RN 2271, RQE 2271, nove anos de formação, 28 dias de pós-operatório.
  Não arredondar nem criar outros.
- **Alternância de fundos** escuro/claro entre seções — não colocar duas seções claras
  ou duas escuras seguidas.
- **No hero do celular, a faixa da foto é `--faixa-foto` (36svh) e o `padding-top` do hero
  repete essa medida.** Os dois andam juntos de propósito: é isso que garante que o texto comece
  abaixo do retrato. Antes a foto era 58% do hero e o texto era ancorado embaixo, então quando a
  copy crescia ela subia por cima do rosto — era o bug de 169px relatado no iPhone 15. Se mexer
  numa das duas medidas, mexa na outra.

## Termos e privacidade

`termos-e-privacidade.html` — página única com os dois documentos, linkada no rodapé das duas
páginas. Reaproveita header, rodapé e tokens; o que é próprio dela são as classes `.legal*`.

- O header leva `.site-header--solid`, porque aqui não há hero escuro atrás dele: sem isso o
  texto branco fica sobre vidro claro em cima do creme e o contraste reprova.
- Eram quatro lacunas; **três foram fechadas com a informação do cliente**: o controlador é o próprio
  Dr. Raimundo Vinícius, pessoa física, sob o CRM/RN 2271 (item 1.1); ele mesmo é o encarregado de
  dados (item 2.1); e o canal para o titular exercer os direitos é o WhatsApp do consultório,
  (84) 99634-9544 (itens 2.1 e 3). **Resta uma**, hoje sem marcação na página: se as conversas do
  WhatsApp são exportadas para algum sistema de gestão e por quanto tempo ficam guardadas antes do
  descarte (item 2.5). Não foram informados pessoa jurídica nem CNPJ — se o consultório um dia
  passar a operar como empresa, o item 1.1 muda. A data de "última atualização" está em
  21 de setembro de 2026 — **precisa ser trocada sempre que o texto mudar.**
- A lista de terceiros do item 4 **não foi escrita de cabeça**: veio de rodar a página e registrar
  os hosts efetivamente contatados (Google Tag Manager, Google Fonts, Google Maps) mais os links de
  saída (WhatsApp, Instagram). Se um dia entrar outro pixel ou um chat, **essa lista precisa ser
  atualizada junto**.
- O site **deixou de ser livre de rastreadores** quando o Google Tag Manager entrou — ver a seção
  "Google Tag Manager" abaixo. As duas afirmações de "não usa cookies próprios" (itens 2.2 e 4)
  foram reescritas na mesma leva, porque tinham virado declaração falsa.

## Botão flutuante do WhatsApp

Classe `.zap`, no canto inferior direito das duas páginas, dentro de um `<aside>` rotulado —
solto no `<body>` ele ficava fora de qualquer marco de página e o axe reprovava (regra `region`).

**Ele não aparece no topo da home.** Um `IntersectionObserver` observa `.hero__action` e só
libera o botão quando o CTA do hero sai da tela. Sem isso os dois pousam no mesmo canto na
primeira dobra, e o flutuante cobre justamente a seta do botão principal — foi o que aconteceu na
primeira versão. Na página de termos não há hero, então ele nasce visível. Sem JS (sem a classe
`.js` no `<html>`), fica visível o tempo todo: o fallback é mostrar, nunca esconder.

O verde é `--whats` em `:root`, não hex solto — a regra de cores vale para ele também. É a única
cor de marca do site; se destoar demais da identidade, trocar por `--sand` é uma linha.

## Google Tag Manager

Contêiner `GTM-5F9BD9FF`, instalado em **ambas as páginas**: o `<script>` no topo do `<head>`,
logo após o `theme-color`, e o `<noscript>` como primeiro elemento do `<body>`. É o snippet do
Google sem alteração, com uma adição: `title="Google Tag Manager"` no `<iframe>`, que o snippet
original não traz e que o axe cobra.

Verificado rodando as duas páginas em `http://` (não em `file://`, onde o GTM tenta um XHR no CSS
e o CORS barra, gerando erro falso): `dataLayer` criado, `gtm.js` requisitado uma vez por página,
zero erros de console, zero violações de acessibilidade.

**O que isso obriga**, e ainda está em aberto:

- **Não há banner de consentimento.** A política declara base legal de legítimo interesse
  (art. 7º, IX) para a medição. Para cookies de marketing ou remarketing, legítimo interesse não
  cobre — aí passa a exigir consentimento prévio, com banner.
- **O contêiner define o que é coletado.** A política descreve o GTM como gerenciador e diz que o
  que é medido depende das etiquetas ativas. Se entrar GA4, Meta Pixel ou Google Ads, o item 4
  precisa nomear cada um.
- **O preview tem `noindex`, mas o GTM dispara assim mesmo.** Enquanto o site estiver no ar só
  para o cliente ver, o tráfego de teste entra na medição.

**Este texto não substitui revisão jurídica.** Ele foi escrito para dar estrutura e cobrir o que a
LGPD pede, a partir do que o site realmente faz — mas quem responde por ele é o cliente.

## Bento

Todas as seções abaixo do hero são uma malha de 12 colunas (`.bento`) em que cada bloco de
conteúdo é uma célula (`.cell`) com moldura, raio e respiro próprios. As larguras vêm de
modificadores — `.cell--3`, `--4`, `--6`, `--8`, `--12` — e `.cell--tall` ocupa duas linhas.
Abaixo de 48 rem tudo desce para uma coluna só.

- **Um nível de caixa por seção.** Onde a seção é uma laje escura, a laje **é** a caixa: as
  células dentro dela ficam sem fundo e sem borda, e o que separa uma da outra é o vão da malha
  mais uma régua dourada (topo nos cards de procedimento, esquerda nos depoimentos). Só a célula
  de destaque (`.cell--accent`) continua sendo caixa — é uma só, então lê como decisão e não como
  moldura repetida. Nas seções claras é o contrário: a seção é a tela, então a caixa é a célula.
  **O respiro da célula fica em pé nos dois casos** — é ele que mantém o texto na mesma vertical.
- **O rodapé fica de fora disso**: largura cheia, sem canto e com a régua de 1 px, como sempre foi.
- **As seções escuras não encostam nas bordas da tela e têm respiro próprio.** Três medidas
  amarradas: `--slab-edge` (folga entre a laje e a borda da tela), `--slab-pad` (respiro interno
  da laje) e a largura, que é `min(100%, var(--shell))` menos duas bordas. A seção clara recebe
  `--slab-edge + --slab-pad` como recuo — é isso que faz o título cair na mesma vertical na
  seção clara e na escura, em qualquer largura (conferido de 390 a 1920). **Mexer numa das três
  sem mexer nas outras desalinha.** No desktop o respiro interno é de 72 px, contra 120 px de
  respiro vertical — proporção que já foi corrigida duas vezes: começou em 12 px (o respiro morava
  na célula, e o cabeçalho da seção, que não é célula, ficava sem nenhum) e passou por 44 px.
- **Nas lajes escuras a malha tem vão largo** (2,5 rem entre linhas, 3 rem entre colunas), já que
  sem moldura é o vão que separa uma coluna da outra. Abaixo de 48 rem a malha vira **uma coluna
  de verdade** (`grid-template-columns: minmax(0, 1fr)`) — mantendo as 12 colunas ali, a soma dos
  onze vãos passava da largura da tela e empurrava o conteúdo para fora.
- **A superfície vem do contexto da seção**, não da célula: em `.section--cream` a célula é
  branca sobre creme; em `.section--navy` é `--steel-fill` sobre o navy. Foi assim que a
  alternância claro/escuro entre seções continuou valendo — se um dia quiser o bento clássico,
  de tela única, é trocar o fundo das seções, não o das células.
- `.cell--accent` (dourado) marca a célula de ação; `.cell--media` zera o respiro para a
  imagem encostar na borda; `.bento__head` e `.bento__note` atravessam as 12 colunas sem moldura.
- Componentes que antes tinham moldura própria — `.card`, `.quote`, `.form-wrap`, `.faq` —
  perderam borda e fundo: em seção clara quem desenha isso é a célula; em seção escura, a laje.

**Cuidado com `<img>` dentro de célula:** os atributos `width`/`height` do HTML entram como
dica de estilo, então um `flex: 1 1 auto` usa a altura do atributo como base e estica a célula.
Use `flex: 1 1 0` (é o caso de `.sobre__photo`) ou `height: auto` com `aspect-ratio`.

## Como chegar

Faixa entre o contato e o rodapé, com o mapa embutido (`.mapa__embed`) e o endereço ao lado.
O `iframe` usa a forma sem chave de API — `maps.google.com/maps?q=<endereço>&output=embed` —
que o Google redireciona para `google.com/maps/embed`. Carrega com `loading="lazy"`, mas
lembre que **ele contata o Google assim que entra na tela**; se isso for problema de privacidade,
trocar por uma imagem estática com link.

O enquadramento é o que o Google escolhe a partir do endereço, e em tela estreita o alfinete
sai do centro. Para controlar isso, pegar o código oficial em Compartilhar → Incorporar um mapa
e trocar só o `src`.

## Hero

Fotografia em sangria total (`assets/img/background.png`, com `background-mobile.png` abaixo
de 768 px) sob um véu em gradiente, texto à esquerda e a marca em cápsula de vidro flutuante.

- A cápsula do header e o texto do hero usam o mesmo token de largura, `--bar` (1020 px), para
  ficarem na mesma vertical. O restante da página ainda usa `--shell` (1180 px) — se quiser
  alinhamento único, é esse token que muda.
- No desktop a foto é `cover` puro, sem ampliação: em repouso ela cabe justa na tela (a imagem
  é 16:9, como a maioria dos monitores). O corte lateral, quando existe, sai da direita
  (`object-position: 40%`), longe do texto. No celular ela ocupa os 58% de cima e o véu fecha em
  `--coal` antes de o texto começar — o rosto nunca fica sob letra.
- A foto tem uma deriva lenta (`@keyframes hero-deriva`, escala 1 → 1.06 em 24 s, vai e volta).
  O repouso é a escala 1, então o enquadramento justo é o estado de partida. Some inteira sob
  `prefers-reduced-motion: reduce`; para desligar de vez, apagar o bloco da animação.
- `background-logo.svg` é o perfil da marca borrado, com 10% de branco já embutido no arquivo.
  Sangra pela esquerda (o desenho continua fora do `viewBox`), fica **acima do véu** — abaixo
  dele o véu o apagaria — e abaixo do texto. Em retrato desce para a base escura, para não
  clarear o rosto da foto. Para reforçar ou apagar o efeito, mexer no `fill-opacity` do arquivo.
- As duas imagens de fundo são PNG de ~5 MB cada. **Converter para WebP/JPEG antes de publicar**:
  são o LCP da página.

## Elemento gráfico de marca

O contorno de perfil facial é SVG inline no monograma do rodapé. O header usa o arquivo
`assets/img/logo.svg` (preto no arquivo, invertido para branco por `filter`).

## Acessibilidade e movimento

- Navegação completa por teclado, com foco visível em dourado.
- O comparador antes/depois responde a mouse, toque e teclado (setas, Shift+setas, Home, End).
- Todo movimento tem versão estática sob `prefers-reduced-motion: reduce`.
- Fontes (Fraunces + Inter) carregadas do Google Fonts com `display=swap`.

Testado nos breakpoints 360, 768, 1024 e 1440 px.
