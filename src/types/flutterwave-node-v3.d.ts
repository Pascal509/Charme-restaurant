declare module "flutterwave-node-v3" {
  const Flutterwave: new (publicKey: string, secretKey: string, encryptKey?: string) => unknown;
  export default Flutterwave;
}
