import React, { useEffect } from "react";
import { getKeplrFromWindow } from "./util/getKeplrFromWindow";
import { CelestiaChainInfo } from "./constants";
import { Dec, DecUtils } from "@keplr-wallet/unit";
import { sendMsgs } from "./util/sendMsgs";
import { simulateMsgs } from "./util/simulateMsgs";
import { MsgSend } from "./proto-types-gen/src/cosmos/bank/v1beta1/tx";
import "./styles/container.css";
import "./styles/button.css";
import "./styles/item.css";

function App() {
  const [pixel_x, setPixelX] = React.useState<string>("");
  const [pixel_y, setPixelY] = React.useState<string>("");
  const [pixel_color, setPixelColor] = React.useState<string>("");

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const keplr = await getKeplrFromWindow();

    if (keplr) {
      try {
        await keplr.experimentalSuggestChain(CelestiaChainInfo);
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.message);
        }
      }
    }
  };

  const submitPixel = async () => {
    if (window.keplr) {
      const key = await window.keplr.getKey(CelestiaChainInfo.chainId);
      const protoMsgs = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: MsgSend.encode({
          fromAddress: key.bech32Address,
          toAddress: "celestia1anqth8kzlkjup240eyxpw9xd9f9lzrxvjtlm3x",
          amount: [
            {
              denom: "utia",
              amount: "10000",
            },
          ],
        }).finish(),
      };

      try {
        // const gasUsed = true;
        // const gasUsed = await simulateMsgs(
        //   CelestiaChainInfo,
        //   key.bech32Address,
        //   [protoMsgs],
        //   [{
        //     denom: "utia",
        //     amount: "236",
        //   }]
        // );

        // if (gasUsed) {
        await sendMsgs(
          window.keplr,
          CelestiaChainInfo,
          key.bech32Address,
          [protoMsgs],
          {
            amount: [
              {
                denom: "utia",
                amount: "236",
              },
            ],
            gas: Math.floor(230000 * 1.5).toString(),
          },
          pixel_x + "," + pixel_y + "," + pixel_color
        );
        // }
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.message);
        }
      }
    }
  };

  return (
    <div className="root-container">
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <h1>🎨 Celestia Paint</h1>
      </div>

      <div className="item">
        <div className="item-title">Change Pixel</div>

        <div className="item-content">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            X:
            <input
              type="text"
              value={pixel_x}
              onChange={(e) => setPixelX(e.target.value)}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            Y:
            <input
              type="text"
              value={pixel_y}
              onChange={(e) => setPixelY(e.target.value)}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            Color:
            <input
              type="text"
              value={pixel_color}
              onChange={(e) => setPixelColor(e.target.value)}
            />
          </div>

          <button className="keplr-button" onClick={submitPixel}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
