export interface IPeer {
  port: number;
  host: string;
}

export interface IPeerEntry {
  id: number,
  host: IPeer,
  lastSeen: Date
}

export interface IConfig {
  port: number,
  address: string,
  externalPort?: number,
  isAllowLocalIp?: boolean,
  peers?: IPeerEntry[],
  priorityNode?: IPeer[],
  exclusiveNode?: IPeer[],
  seedNode?: IPeer[],
  hideMyPort?: number
};