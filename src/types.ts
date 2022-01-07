export type LimitConfig = Map<string, number>;

export type SendConfig = {
  dest: string;
  token: string;
  balance: string;
}[];

export type MessageHandler = (channel: Record<string, string | undefined>, configs: SendConfig, tx: string) => void;
