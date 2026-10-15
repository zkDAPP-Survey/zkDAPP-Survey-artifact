// Desktop baseline for the native prover used by the app (same Rust code and zkey as on the phone).
// Run by zk/measure/measure.js --native:
//   BENCH_INPUT=<mopro input json> BENCH_RUNS=20 BENCH_WARMUP=2 cargo test --release --test bench_v4 -- --nocapture
use std::time::Instant;
use zksurvey::{generate_circom_proof_timed, verify_circom_proof, ProofLib};

#[test]
fn bench_v4() {
    let inputs = std::fs::read_to_string(std::env::var("BENCH_INPUT").expect("set BENCH_INPUT")).unwrap();
    let runs: usize = std::env::var("BENCH_RUNS").ok().and_then(|v| v.parse().ok()).unwrap_or(20);
    let warmup: usize = std::env::var("BENCH_WARMUP").ok().and_then(|v| v.parse().ok()).unwrap_or(2);
    let zkey = "./test-vectors/circom/eligibility_v4.zkey".to_string();
    for run in 1..=(warmup + runs) {
        let started = Instant::now();
        let timed = futures::executor::block_on(generate_circom_proof_timed(zkey.clone(), inputs.clone(), ProofLib::Arkworks)).unwrap();
        let total_ms = started.elapsed().as_secs_f64() * 1000.0;
        let verify_started = Instant::now();
        let ok = verify_circom_proof(zkey.clone(), timed.proof_result, ProofLib::Arkworks).unwrap();
        let verify_ms = verify_started.elapsed().as_secs_f64() * 1000.0;
        assert!(ok, "proof did not verify");
        println!(
            "BENCH {{\"run\":{},\"warmup\":{},\"witnessMs\":{},\"provingMs\":{},\"totalMs\":{:.3},\"verifyMs\":{:.3}}}",
            run, run <= warmup, timed.witness_ms, timed.proving_ms, total_ms, verify_ms
        );
    }
}
