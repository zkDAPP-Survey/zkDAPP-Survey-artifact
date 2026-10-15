# zkDAPP-Survey: Source Code

Source code of zkDAPP-Survey, a privacy-preserving survey system in which eligibility is proven on the phone with zero-knowledge proofs over EUDI-compatible SD-JWT credentials and verified by a smart contract on Ethereum.

| Folder | Component | Language |
|---|---|---|
| [`frontend/`](frontend) | zkDAPP mobile application, eligibility circuit, survey contract, relayer | TypeScript, Circom, Solidity |
| [`wallet/`](wallet) | Valera identity wallet with our extensions (issuer connection, Baby Jubjub keys, deep-link disclosure) | Kotlin |
| [`issuer/`](issuer) | Credential issuer of zk-friendly SD-JWT credentials | TypeScript (NestJS) |
| [`census3/`](census3) | Census3 fork with ERC-1155 support for building the census | Go |
| [`prover/`](prover) | Native Groth16 prover (Mopro) with React Native bindings | Rust |

Setup instructions are in the README of each folder. Start with [`frontend/README.md`](frontend/README.md).

Live service URLs are replaced with placeholders (e.g. `https://issuer.example.org`) for anonymous review.
