import React, { useEffect } from 'react';
import { getKeplrFromWindow } from "./util/getKeplrFromWindow";
import { OsmosisChainInfo } from "./constants";
import { Balances } from "./types/balance";
import { Dec, DecUtils } from "@keplr-wallet/unit";
import { sendMsgs } from "./util/sendMsgs";
import { api } from "./util/api";
import { simulateMsgs } from "./util/simulateMsgs";
import { MsgSend } from "./proto-types-gen/src/cosmos/bank/v1beta1/tx";
import "./styles/container.css";
import "./styles/button.css";
import "./styles/item.css";

function App() {
  const [pixel_x, setPixelX] = React.useState<string>('');
  const [pixel_y, setPixelY] = React.useState<string>('');
  const [pixel_color, setPixelColor] = React.useState<string>('');

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const keplr = await getKeplrFromWindow();

    if (keplr) {
      try {
        await keplr.experimentalSuggestChain(OsmosisChainInfo);
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.message);
        }
      }
    }
  }

  const submitPixel = async () => {
    if (window.keplr) {
      const key = await window.keplr.getKey(OsmosisChainInfo.chainId);
      const protoMsgs = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: MsgSend.encode({
          fromAddress: key.bech32Address,
          toAddress: key.bech32Address,
          amount: [
            {
              denom: "uosmo",
              amount: DecUtils.getTenExponentN(6).mul(new Dec(0)).truncate().toString(),
            },
          ],
        }).finish(),
      }

      try {
        const gasUsed = await simulateMsgs(
          OsmosisChainInfo,
          key.bech32Address,
          [protoMsgs],
          [{
            denom: "uosmo",
            amount: "236",
          }]
        );

        if (gasUsed) {
          await sendMsgs(
            window.keplr,
            OsmosisChainInfo,
            key.bech32Address,
            [protoMsgs],
            {
              amount: [{
                denom: "uosmo",
                amount: "236",
              }],
              gas: Math.floor(gasUsed * 1.5).toString(),
            })
        }
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.message);
        }
      }

    }
  }


  return (
    <div className="root-container">
      <div style={{
        display: "flex",
        justifyContent: "center",
        padding: "16px"
      }}>
        <h1>🎨 Celestia Paint</h1>
      </div>

      <div className="item">
        <div className="item-title">
          Change Pixel
        </div>

        <div className="item-content">
          <div style={{
            display: "flex",
            flexDirection: "column"
          }}>
            X:
            <input type="text" value={pixel_x} onChange={(e) => setPixelX(e.target.value)} />
          </div>

          <div style={{
            display: "flex",
            flexDirection: "column"
          }}>
            Y:
            <input type="text" value={pixel_y} onChange={(e) => setPixelY(e.target.value)} />
          </div>

          <div style={{
            display: "flex",
            flexDirection: "column"
          }}>
            Color:
            <input type="text" value={pixel_color} onChange={(e) => setPixelColor(e.target.value)} />
          </div>

          <button className="keplr-button" onClick={submitPixel}>Send</button>
        </div>

      </div>
    </div>
  );
}

export default App;
