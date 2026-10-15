// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
    uint256 constant alphay  = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
    uint256 constant betax1  = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
    uint256 constant betax2  = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
    uint256 constant betay1  = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
    uint256 constant betay2  = 10505242626370262277552901082094356697409835680220590971873171140371331206856;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 3183718449583503261709775165592758942859591853498998059358290379496590915144;
    uint256 constant deltax2 = 10225245097359940941846827061903415342771757042490456703995970572118178719530;
    uint256 constant deltay1 = 7203435235457725698864467789032291359648794511874709589014138902941858893093;
    uint256 constant deltay2 = 5386020399081594887187921203934350269370158675229018759446891920541463622113;

    
    uint256 constant IC0x = 2208643511949917422631597820101801773874681874508362230140257843041334731175;
    uint256 constant IC0y = 7512700180655162096726141020027581458840223576173360304346248201917630434986;
    
    uint256 constant IC1x = 12638662342081322624554528134291553125153557299750015957502335038243583275051;
    uint256 constant IC1y = 1382834273713740674968780841134377208587713242681967074349139021937674743322;
    
    uint256 constant IC2x = 15277287377078486391241078964644082254193433154793362251794973494548587469170;
    uint256 constant IC2y = 2454598385603069184657651634593429040987243659794603370101889229761433510888;
    
    uint256 constant IC3x = 11271120326308827164365916285929783004982449813940266328774975992961258790610;
    uint256 constant IC3y = 16112636475479986862267729339781098605728300482368920189047613162678702880029;
    
    uint256 constant IC4x = 20026296158110558816539945406947608635474223047463527098666899534199453442871;
    uint256 constant IC4y = 32728914523462733995914658858125299588018266185522102426852993667575957964;
    
    uint256 constant IC5x = 5438105300360987165588548510988364115108312778077972386161996490306646108254;
    uint256 constant IC5y = 20207786472664275746754244603795143770348334150493332544649330011191503422451;
    
    uint256 constant IC6x = 9930847468627663212243786160776247445434457358794950561595023549125469432101;
    uint256 constant IC6y = 4612930247979530453738208342060676067701917746964611091305910893777557546353;
    
    uint256 constant IC7x = 1744883042624438414287566046471194361387562863045283991585878095895289516659;
    uint256 constant IC7y = 13569511795622388122932194534609646915485030109019671416810299951555478540924;
    
    uint256 constant IC8x = 4857418293704600977640145817369725801909299149065739928042386316900349762037;
    uint256 constant IC8y = 16297481260489130807448714206358918896727244139545896640302763375498925068038;
    
    uint256 constant IC9x = 12319296611066241842926101740318566248671918580007190598662559278285809157650;
    uint256 constant IC9y = 18566949536644395409879313121150872496779290572001322228444720885025521371440;
    
    uint256 constant IC10x = 1529915771521818728521798365526637006134894514108440422798963343130703912985;
    uint256 constant IC10y = 5625856496359346179729335244344030664919634382835776857817615652603235425835;
    
    uint256 constant IC11x = 2588705223548884644446757883002629119414868488416136818467722317662835545946;
    uint256 constant IC11y = 20341401354253339065653488409543396943807060145974464020215547319105896567341;
    
    uint256 constant IC12x = 558545158964916833573979493344804219871747760759227961008586770229756291613;
    uint256 constant IC12y = 20387471279477215371298264721072797974567199718080514450754230891558675350980;
    
    uint256 constant IC13x = 11279540192481409879456947355613763118955279556776864054241891318998402244838;
    uint256 constant IC13y = 4525087990178471312732693152991390953134611718286117898653496255180096555472;
    
    uint256 constant IC14x = 16117570144221068204534961602313831322257510987711349355776019999933203591458;
    uint256 constant IC14y = 15716783911126961424737696122183607456864020839920782490317771677313332061496;
    
    uint256 constant IC15x = 15462404954087888568454268625699761887622298256923298951996936113458007600606;
    uint256 constant IC15y = 16890693268336204457136876038592923919836867096212788565825621623604632171857;
    
    uint256 constant IC16x = 1822530082116781068271631925098864111133978360966741333969036458936690365501;
    uint256 constant IC16y = 9056376547937674818399128584182467325173459114064890443171632118658026704425;
    
    uint256 constant IC17x = 21835708398664890567408311452472451422576834877066090539679602153372181089617;
    uint256 constant IC17y = 812998372403797454281648537219616277349339430274854123246122881360676912313;
    
    uint256 constant IC18x = 18313868521669741026274529611077382840791808761782663346174232661196992825805;
    uint256 constant IC18y = 17460590534021709685196394590654696472798199555518687506553759754584782307517;
    
    uint256 constant IC19x = 20713210686888587051215204855397653923832750493323404582632962477155430206064;
    uint256 constant IC19y = 415160004922191988424334417286395646192790804065503566225929666174952859059;
    
    uint256 constant IC20x = 8597514165212891692748662145251030675262346747804739726716435605633382316366;
    uint256 constant IC20y = 14097470852495971003405114742980877968041201114995431973533895698544790945115;
    
    uint256 constant IC21x = 6124911693095342084153971348283249361930624441915944141885905622457081247533;
    uint256 constant IC21y = 321033974385593028446209312333259593674403940541525581285813019819138082050;
    
    uint256 constant IC22x = 14150127429940286026942017962925870181998138653255851769698321887375215644916;
    uint256 constant IC22y = 11711745367713507626243418993318106602530287796833386037444213694801818438165;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[22] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                
                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))
                
                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))
                
                g1_mulAccC(_pVk, IC21x, IC21y, calldataload(add(pubSignals, 640)))
                
                g1_mulAccC(_pVk, IC22x, IC22y, calldataload(add(pubSignals, 672)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            
            checkField(calldataload(add(_pubSignals, 448)))
            
            checkField(calldataload(add(_pubSignals, 480)))
            
            checkField(calldataload(add(_pubSignals, 512)))
            
            checkField(calldataload(add(_pubSignals, 544)))
            
            checkField(calldataload(add(_pubSignals, 576)))
            
            checkField(calldataload(add(_pubSignals, 608)))
            
            checkField(calldataload(add(_pubSignals, 640)))
            
            checkField(calldataload(add(_pubSignals, 672)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
