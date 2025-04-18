# Setup a Kernel Account and sponsor its Gas
## ZeroDev SDK and Candide InstaGas 

This is example showcase how to deploy a Kernel account while sponsoring its transactions gas fees using @zerodev-sdk and Candide's InstaGas.

### Getting Started

This example runs on Arbitrum Sepolia, but you can configure it to run on any of the supported networks. 

#### Setup
- Create both an App and a Gas Policy on Candide's [Dashboard](https://dashboard.candide.dev).
- Create a .env file from .env.example.
```
cp .env.example .env
```
- Copy the bundler and paymaster url from the app and the sponsorship policy id from a private gas policy.


#### Running

```bash
npm install
npm start
```
