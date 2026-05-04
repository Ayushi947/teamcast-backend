declare global {
  const gc: () => void;
  namespace NodeJS {
    interface Process {
      report: {
        getReport: () => any;
        writeReport: (filename?: string) => void;
      };
    }
  }
}

export {};
