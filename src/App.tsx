import React, { useEffect, useState } from "react";
import { getKeplrFromWindow } from "./util/getKeplrFromWindow";
import { CelestiaChainInfo } from "./constants";
import { sendMsgs } from "./util/sendMsgs";
import { MsgSend } from "./proto-types-gen/src/cosmos/bank/v1beta1/tx";
import "./styles/container.css";
import "./styles/button.css";
import "./styles/item.css";

function App() {
  const [pixel_x, setPixelX] = React.useState<string>("");
  const [pixel_y, setPixelY] = React.useState<string>("");
  const [pixel_color, setPixelColor] = React.useState<string>("");
  const [pixels, setPixels] = useState<PixelData[]>([]); // Add this line

  useEffect(() => {
    init();
    fetchPixelData().then((data) => setPixels(data)); // Fetch pixel data on mount
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

  type PixelData = {
    x: number;
    y: number;
    color: string;
  };

  const fetchPixelData = async (): Promise<PixelData[]> => {
    // Replace this with your actual fetch call
    return [
      { x: 0, y: 0, color: "#FF0000" },
      { x: 1, y: 0, color: "#00FF00" },
      { x: 0, y: 1, color: "#0000FF" },
      { x: 1, y: 1, color: "#FFFF00" },
      // ... more data
    ];
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

      <div className="pixel-art-container">
        {pixels.map((pixel, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              left: `${pixel.x * 10}px`,
              top: `${pixel.y * 10}px`,
              width: "10px",
              height: "10px",
              backgroundColor: pixel.color,
            }}
          />
        ))}
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
    </div >
  );
}

export default App;
