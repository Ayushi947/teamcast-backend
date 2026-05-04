export function singleton<T extends { new (...args: any[]): any }>(
  constructor: T
) {
  let instance: any = null;

  return class extends constructor {
    constructor(...args: any[]) {
      if (!instance) {
        super(...args);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        instance = this;
      }
      return instance;
    }
  } as T;
}
