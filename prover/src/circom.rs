use crate::MoproError;
use circom_prover::{
    prover::{
        circom::{
            Proof as CircomProverProof, CURVE_BLS12_381, CURVE_BN254, G1 as CircomProverG1,
            G2 as CircomProverG2,
        },
        ProofLib as CircomProverProofLib,
    },
    CircomProver,
};
use num_bigint::BigUint;
use std::str::FromStr;

//
// Data structures for Circom proof representation
//
#[derive(Debug, Clone)]
#[cfg_attr(feature = "uniffi", derive(uniffi::Record))]
pub struct CircomProofResult {
    pub proof: CircomProof,
    pub inputs: Vec<String>,
}

#[derive(Debug, Clone, Default)]
#[cfg_attr(feature = "uniffi", derive(uniffi::Record))]
pub struct G1 {
    pub x: String,
    pub y: String,
    pub z: String,
}

#[derive(Debug, Clone, Default)]
#[cfg_attr(feature = "uniffi", derive(uniffi::Record))]
pub struct G2 {
    pub x: Vec<String>,
    pub y: Vec<String>,
    pub z: Vec<String>,
}

#[derive(Debug, Clone, Default)]
#[cfg_attr(feature = "uniffi", derive(uniffi::Record))]
pub struct CircomProof {
    pub a: G1,
    pub b: G2,
    pub c: G1,
    pub protocol: String,
    pub curve: String,
}

#[derive(Debug, Clone, Default)]
#[cfg_attr(feature = "uniffi", derive(uniffi::Enum))]
pub enum ProofLib {
    #[default]
    Arkworks,
    Rapidsnark,
}

//
// `From` implementation for proof conversion
//
impl From<CircomProverProof> for CircomProof {
    fn from(proof: CircomProverProof) -> Self {
        CircomProof {
            a: proof.a.into(),
            b: proof.b.into(),
            c: proof.c.into(),
            protocol: proof.protocol,
            curve: proof.curve,
        }
    }
}

impl From<CircomProof> for CircomProverProof {
    fn from(proof: CircomProof) -> Self {
        CircomProverProof {
            a: proof.a.into(),
            b: proof.b.into(),
            c: proof.c.into(),
            protocol: proof.protocol,
            curve: proof.curve,
        }
    }
}

impl From<CircomProverG1> for G1 {
    fn from(g1: CircomProverG1) -> Self {
        G1 {
            x: g1.x.to_string(),
            y: g1.y.to_string(),
            z: g1.z.to_string(),
        }
    }
}

impl From<G1> for CircomProverG1 {
    fn from(g1: G1) -> Self {
        CircomProverG1 {
            x: BigUint::from_str(g1.x.as_str()).unwrap(),
            y: BigUint::from_str(g1.y.as_str()).unwrap(),
            z: BigUint::from_str(g1.z.as_str()).unwrap(),
        }
    }
}

impl From<CircomProverG2> for G2 {
    fn from(g2: CircomProverG2) -> Self {
        let x = vec![g2.x[0].to_string(), g2.x[1].to_string()];
        let y = vec![g2.y[0].to_string(), g2.y[1].to_string()];
        let z = vec![g2.z[0].to_string(), g2.z[1].to_string()];
        G2 { x, y, z }
    }
}

impl From<G2> for CircomProverG2 {
    fn from(g2: G2) -> Self {
        CircomProverG2 {
            x: [
                BigUint::from_str(g2.x[0].as_str()).unwrap(),
                BigUint::from_str(g2.x[1].as_str()).unwrap(),
            ],
            y: [
                BigUint::from_str(g2.y[0].as_str()).unwrap(),
                BigUint::from_str(g2.y[1].as_str()).unwrap(),
            ],
            z: [
                BigUint::from_str(g2.z[0].as_str()).unwrap(),
                BigUint::from_str(g2.z[1].as_str()).unwrap(),
            ],
        }
    }
}

impl Into<CircomProverProofLib> for ProofLib {
    fn into(self) -> CircomProverProofLib {
        match self {
            ProofLib::Arkworks => CircomProverProofLib::Arkworks,
            ProofLib::Rapidsnark => CircomProverProofLib::Rapidsnark,
        }
    }
}

//
// Main functions for proof generation and verification
//

#[cfg_attr(feature = "uniffi", uniffi::export)]
pub fn generate_circom_proof(
    zkey_path: String,
    circuit_inputs: String,
    proof_lib: ProofLib,
) -> Result<CircomProofResult, MoproError> {
    let name = std::path::Path::new(zkey_path.as_str())
        .file_name()
        .ok_or_else(|| {
            MoproError::CircomError("failed to parse file name from zkey_path".to_string())
        })?;

    let witness_fn = crate::circom_get(name.to_str().unwrap()).ok_or_else(|| {
        MoproError::CircomError(format!("Unknown ZKEY: {}", name.to_string_lossy()))
    })?;

    let ret = CircomProver::prove(proof_lib.into(), witness_fn, circuit_inputs, zkey_path)
        .map_err(|e| MoproError::CircomError(format!("Generate Proof error: {}", e)))?;

    let (proof, pub_inputs) = match ret.proof.curve.as_ref() {
        CURVE_BN254 | CURVE_BLS12_381 => (ret.proof.into(), ret.pub_inputs.into()),
        _ => {
            return Err(MoproError::CircomError(format!(
                "Unsupported curve: {}",
                ret.proof.curve
            )))
        }
    };

    Ok(CircomProofResult {
        proof,
        inputs: pub_inputs,
    })
}

#[cfg_attr(feature = "uniffi", uniffi::export)]
pub fn verify_circom_proof(
    zkey_path: String,
    proof_result: CircomProofResult,
    proof_lib: ProofLib,
) -> Result<bool, MoproError> {
    let chosen_proof_lib = proof_lib.into();
    CircomProver::verify(
        chosen_proof_lib,
        circom_prover::prover::CircomProof {
            proof: proof_result.proof.into(),
            pub_inputs: proof_result.inputs.into(),
        },
        zkey_path,
    )
    .map_err(|e| MoproError::CircomError(format!("Verification error: {}", e)))
}

#[macro_export]
macro_rules! set_circom_circuits {
    // Accept any number of (key, func) pairs
    ($(($key:expr, $func:expr)),+ $(,)?) => {

        // Adjust the path if these types live elsewhere
        use circom_prover::witness::WitnessFn;

        const CIRCOM_CIRCUITS: &[(&'static str, WitnessFn)] = &[
            $(
                ($key, $func),
            )+
        ];

        #[inline]
        pub(crate) fn circom_get(name: &str) -> Option<WitnessFn> {
            CIRCOM_CIRCUITS.iter()
                .find(|(k, _)| *k == name)
                .map(|(_, v)| *v)
        }
    };
}

/// Proof plus the time spent in each proving stage, measured in native code.
#[derive(Debug, Clone)]
#[cfg_attr(feature = "uniffi", derive(uniffi::Record))]
pub struct TimedCircomProofResult {
    pub proof_result: CircomProofResult,
    /// Witness calculation (rust-witness)
    pub witness_ms: u64,
    /// Groth16 proving, including reading the zkey (arkworks / rapidsnark)
    pub proving_ms: u64,
}

/// Like `generate_circom_proof`, but runs on its own thread and reports stage timings.
/// Being async, it returns a Promise in React Native, so the JS thread stays responsive while proving.
#[cfg_attr(feature = "uniffi", uniffi::export)]
pub async fn generate_circom_proof_timed(
    zkey_path: String,
    circuit_inputs: String,
    proof_lib: ProofLib,
) -> Result<TimedCircomProofResult, MoproError> {
    let (sender, receiver) = futures::channel::oneshot::channel();
    std::thread::spawn(move || {
        // Witness generation unwraps internally, so invalid inputs panic instead of returning an error
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            prove_timed(zkey_path, circuit_inputs, proof_lib)
        }))
        .unwrap_or_else(|_| {
            Err(MoproError::CircomError(
                "Proof generation panicked: the inputs are malformed or do not satisfy the circuit".to_string(),
            ))
        });
        let _ = sender.send(result);
    });
    receiver
        .await
        .map_err(|_| MoproError::CircomError("Prover thread stopped unexpectedly".to_string()))?
}

fn prove_timed(
    zkey_path: String,
    circuit_inputs: String,
    proof_lib: ProofLib,
) -> Result<TimedCircomProofResult, MoproError> {
    let name = std::path::Path::new(zkey_path.as_str())
        .file_name()
        .ok_or_else(|| {
            MoproError::CircomError("failed to parse file name from zkey_path".to_string())
        })?;

    let witness_fn = crate::circom_get(name.to_str().unwrap()).ok_or_else(|| {
        MoproError::CircomError(format!("Unknown ZKEY: {}", name.to_string_lossy()))
    })?;

    let started = std::time::Instant::now();
    let witness = circom_prover::witness::generate_witness(witness_fn, circuit_inputs)
        .join()
        .map_err(|_| {
            MoproError::CircomError(
                "Witness generation failed: the inputs do not satisfy the circuit".to_string(),
            )
        })?;
    let witness_ms = started.elapsed().as_millis() as u64;

    let started = std::time::Instant::now();
    let ret = circom_prover::prover::prove(
        proof_lib.into(),
        zkey_path,
        std::thread::spawn(move || witness),
    )
    .map_err(|e| MoproError::CircomError(format!("Generate Proof error: {}", e)))?;
    let proving_ms = started.elapsed().as_millis() as u64;

    let (proof, pub_inputs) = match ret.proof.curve.as_ref() {
        CURVE_BN254 | CURVE_BLS12_381 => (ret.proof.into(), ret.pub_inputs.into()),
        _ => {
            return Err(MoproError::CircomError(format!(
                "Unsupported curve: {}",
                ret.proof.curve
            )))
        }
    };

    Ok(TimedCircomProofResult {
        proof_result: CircomProofResult {
            proof,
            inputs: pub_inputs,
        },
        witness_ms,
        proving_ms,
    })
}
