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
    uint256 constant deltax1 = 21448304259497962053651859857634307944650102982857964016826347157460826605819;
    uint256 constant deltax2 = 20759542255400173680021475779673875028669443290827482651117254437090631219473;
    uint256 constant deltay1 = 12147115257213182021415163546408147123528367605708368553881716421114996544788;
    uint256 constant deltay2 = 5650269011519270641015431323717038342611516661341370209341644812540019369338;

    
    uint256 constant IC0x = 710821702390988714864792928997306831282184547170772847780299460749513807859;
    uint256 constant IC0y = 17864298955263568999835059851529401509108007867014471694548197147785950892728;
    
    uint256 constant IC1x = 10147691250758015426725992253547677023371448118102515085670696653411321699669;
    uint256 constant IC1y = 8260201445650213790439958221650759370198951401470849288281949278506469780928;
    
    uint256 constant IC2x = 12427183010779109500280033381387392647093899053117005079723749431876778718508;
    uint256 constant IC2y = 15388782087501969658688281321377985101984073888651727771786397520123810833010;
    
    uint256 constant IC3x = 17618441736286672629231666919933617573016425343157652551434186900216792026829;
    uint256 constant IC3y = 14033575661195302688483483192551348477528823256381575054680960915552291469469;
    
    uint256 constant IC4x = 20910228261651971451258880030118415985241877352367455322655498181267309918357;
    uint256 constant IC4y = 316153485335110046206390634226928023172784124349386701374799910730403419215;
    
    uint256 constant IC5x = 13933939590783969523655730372124745459913694205183646254237625198544589470790;
    uint256 constant IC5y = 15545498016810795208258481522906252193667752633690701080059447718656306338512;
    
    uint256 constant IC6x = 8204475669778598196963055937557111653032482659011581647660686020580194837606;
    uint256 constant IC6y = 6541849207554564174229398462783744895240506939235097593428524232851116104672;
    
    uint256 constant IC7x = 6036567934386927127575572595553231854862134415893157857612010924961877722935;
    uint256 constant IC7y = 5120783938746955812270704280115145135070595831538975662909129617831289908565;
    
    uint256 constant IC8x = 17515653808895506215362526039137970849477555449249313391954370753363426007255;
    uint256 constant IC8y = 1438847585823682197608893906898561970554652766939427359371654743433529976247;
    
    uint256 constant IC9x = 9237545603956095223594827096620975313307756396199700404913574817953711516217;
    uint256 constant IC9y = 18244982878231012889328161183039031241964572013195921309400039501875018824611;
    
    uint256 constant IC10x = 5097229915684529822111892460531228525511856776170842439159013484287722846414;
    uint256 constant IC10y = 382707882761952006661987421267383004712460862089401189316805094224772018061;
    
    uint256 constant IC11x = 12150688841937614241659259991736510936776113574858561148684922973037009047028;
    uint256 constant IC11y = 11082742399004619802926409843526165762263476713041086908093262519044313730135;
    
    uint256 constant IC12x = 6892775711857498330502450440147932002512053548144812014109399808697271295034;
    uint256 constant IC12y = 10136301346142116534905961491330328695930097124022406651565496641887603713708;
    
    uint256 constant IC13x = 3727268746233449888599452623816994301926337813813496183348684579694501568958;
    uint256 constant IC13y = 5702533439150911889881046148879658825236643255459145596586603482559826712187;
    
    uint256 constant IC14x = 5355632841984209439682389932647983539020846093097629757490727248912705158604;
    uint256 constant IC14y = 21484512234303152825971848680183751630868127754446882417800893701236300075484;
    
    uint256 constant IC15x = 2440327788533929036357476538925290820715105276409413740985502984046856799539;
    uint256 constant IC15y = 15393863819148082339958835494433335146532153977453249826601056585925519401732;
    
    uint256 constant IC16x = 13033637636642592844538680215423945341538340577898873815144693588840354770473;
    uint256 constant IC16y = 12838237975635414030215804057921671028524503600615380997176391657638780623107;
    
    uint256 constant IC17x = 14271119633432372066534553678334573753159451422094448714745081917999986176364;
    uint256 constant IC17y = 5990217571719308704769813201563442217411092843333278686787810784610368718714;
    
    uint256 constant IC18x = 15705762957896139914764942535664016067878592296768717278066695258184937686289;
    uint256 constant IC18y = 6035124230676275414711621933239344529201196855876005219547508887040794654888;
    
    uint256 constant IC19x = 19689277947868256239197865780951969444556763284578996013245539123400594051558;
    uint256 constant IC19y = 14468713483345736885821141179244988882136661363953462364726226428051891600100;
    
    uint256 constant IC20x = 19087840068877433041490776289630062084415160107586290594832431828925588180172;
    uint256 constant IC20y = 20896325581584979199975241972565326839831770606163948954169768075081841104395;
    
    uint256 constant IC21x = 13065138811243269814969096256011427868543971347094455294973325031061703771723;
    uint256 constant IC21y = 16705648099191953149342110461774658804927322121058340734125898024822052434843;
    
    uint256 constant IC22x = 13546423895364585284827657299109667051530462214914130386201423413214364968539;
    uint256 constant IC22y = 2460220743142427511396855572068102069924134751173621097216835120176463191782;
    
 
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
