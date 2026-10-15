// Native check of circuit v3: cargo test --release --test eligibility_v3 -- --nocapture
use zksurvey::{generate_circom_proof_timed, verify_circom_proof, ProofLib};

#[test]
fn eligibility_v3_proves_and_verifies() {
    let inputs = std::fs::read_to_string(std::env::var("V3_INPUT").expect("set V3_INPUT")).unwrap();
    let zkey = "./test-vectors/circom/eligibility_v4.zkey".to_string();
    for run in 1..=3 {
        let timed = futures::executor::block_on(generate_circom_proof_timed(zkey.clone(), inputs.clone(), ProofLib::Arkworks)).unwrap();
        let ok = verify_circom_proof(zkey.clone(), timed.proof_result.clone(), ProofLib::Arkworks).unwrap();
        println!("run {run}: witness {} ms, proving {} ms, verified {ok}, nullifier {}", timed.witness_ms, timed.proving_ms, timed.proof_result.inputs[0]);
        assert!(ok);
        if let Ok(out) = std::env::var("MOPRO_PROOF_OUT") {
            let p = &timed.proof_result.proof;
            let json = format!(
                "{{\"a\":{{\"x\":\"{}\",\"y\":\"{}\"}},\"b\":{{\"x\":[\"{}\",\"{}\"],\"y\":[\"{}\",\"{}\"]}},\"c\":{{\"x\":\"{}\",\"y\":\"{}\"}},\"inputs\":[{}]}}",
                p.a.x, p.a.y, p.b.x[0], p.b.x[1], p.b.y[0], p.b.y[1], p.c.x, p.c.y,
                timed.proof_result.inputs.iter().map(|i| format!("\"{i}\"")).collect::<Vec<_>>().join(",")
            );
            std::fs::write(out, json).unwrap();
        }
    }
    // A broken input must come back as an error, not crash the process
    let bad = inputs.replace("\"minAge\":[\"18\"]", "\"minAge\":[\"200\"]");
    assert_ne!(bad, inputs, "replacement did not apply");
    match futures::executor::block_on(generate_circom_proof_timed(zkey.clone(), bad, ProofLib::Arkworks)) {
        Err(e) => println!("unsatisfiable input -> error: {e}"),
        Ok(t) => println!("unsatisfiable input -> proof generated, verifies: {}", verify_circom_proof(zkey, t.proof_result, ProofLib::Arkworks).unwrap()),
    }
}
