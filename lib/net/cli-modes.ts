export type CliModeId = "usuario" | "privilegiado" | "global" | "interface";

export interface CliMode {
  id: CliModeId;
  name: string;

  prompt: string;

  allows: string;

  denies: string | null;

  enter: string | null;

  leave: string | null;
}

export const CLI_MODES: CliMode[] = [
  {
    id: "usuario",
    name: "Usuário",
    prompt: "Switch>",
    allows: "Comandos de exibição básicos. É onde a sessão começa.",
    denies: "Nada de configuração, e nem os comandos de diagnóstico.",
    enter: null,
    leave: null,
  },
  {
    id: "privilegiado",
    name: "Privilegiado",
    prompt: "Switch#",
    allows: "Diagnóstico completo, show e debug, e a entrada na configuração.",
    denies: "Alterar o equipamento ainda não é possível aqui.",
    enter: "enable",
    leave: "disable",
  },
  {
    id: "global",
    name: "Configuração global",
    prompt: "Switch(config)#",
    allows: "Alterar o que vale para o equipamento inteiro — nome, senhas, VLANs.",
    denies: "Parâmetros de uma porta específica pedem o modo de interface.",
    enter: "configure terminal",
    leave: "exit",
  },
  {
    id: "interface",
    name: "Configuração de interface",
    prompt: "Switch(config-if)#",
    allows: "Alterar uma porta: descrição, VLAN de acesso, velocidade, duplex.",
    denies: null,
    enter: "interface FastEthernet0/1",
    leave: "exit",
  },
];

export function cliModeAt(depth: number): CliMode {
  return CLI_MODES[Math.max(0, Math.min(CLI_MODES.length - 1, depth))]!;
}

export function promptSymbol(mode: CliMode): ">" | "#" {
  return mode.prompt.endsWith(">") ? ">" : "#";
}

export interface TaskStep {
  action: string;

  detail: string;
}

export interface TaskComparison {
  task: string;
  gui: TaskStep[];
  cli: TaskStep[];

  lesson: string;
}

export const TASK_COMPARISONS: TaskComparison[] = [
  {
    task: "Descrever uma porta do switch",
    gui: [
      { action: "Abrir o navegador", detail: "Precisa de um endereço IP já configurado no equipamento." },
      { action: "Entrar com usuário e senha", detail: "Formulário da interface web." },
      { action: "Navegar até Switching", detail: "O caminho do menu muda entre fabricantes e versões de firmware." },
      { action: "Abrir Port Settings", detail: "Localizar a porta na lista." },
      { action: "Clicar na linha da porta 1", detail: "Abre o formulário de edição." },
      { action: "Preencher Description", detail: "Digitar “Porta do PC1”." },
      { action: "Clicar em Apply", detail: "A alteração passa a valer." },
      { action: "Clicar em Save", detail: "Sem este passo, o reinício desfaz tudo." },
    ],
    cli: [
      { action: "enable", detail: "Do modo usuário para o privilegiado." },
      { action: "configure terminal", detail: "Entra na configuração global." },
      { action: "interface FastEthernet0/1", detail: "Entra na configuração daquela porta." },
      { action: "description Porta do PC1", detail: "A alteração em si." },
      { action: "end", detail: "Volta ao modo privilegiado." },
      { action: "copy running-config startup-config", detail: "Salva para sobreviver ao reinício." },
    ],
    lesson:
      "A contagem de passos é parecida, e não é aí que está a diferença. O bloco da direita pode ser colado em quarenta switches sem alteração, versionado num arquivo e lido daqui a um ano como registro exato do que foi feito. A sequência da esquerda só existe enquanto alguém a repete, e o caminho do menu muda com o firmware.",
  },
];
