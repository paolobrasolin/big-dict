export type Attestation = {
  isoDate: string;
  context: string;
};

export type Result = {
  source: URL;
  visited: Date;
  published: string | null;
  fullText?: string;
  attestations: Attestation[];
};
