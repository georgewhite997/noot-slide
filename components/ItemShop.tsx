import { useState } from "react";
import { IItem, IUserItem } from "../utils";

type ItemsProps = {
    onClose: () => void;
    address: string;
    items: IUserItem[];
    handlePurchase: (p: IUserItem, quantity?: number) => void;
    onToggle: (p: IUserItem) => void;
};

export const ItemShop = ({
    onClose,
    address,
    items,
    handlePurchase,
    onToggle,
}: ItemsProps) => {
    return (
        <div style={{ background: "radial-gradient(circle, #0CBED2 0%, #0A94BC 100%)" }} className="h-full pt-[24px]">
            <div className="relative">
                <button
                    className="text-white absolute left-0 w-[40px] h-[40px] mx-[24px] mb-[16px]"
                    onClick={onClose}
                >
                    <img src="/small-button.png" alt="bg" className="absolute top-0 left-0" />
                    <img src="/arrow.png" alt="back" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10]" />
                </button>
                <h1 className="text-white text-[32px] font-bold text-center">Item Shop</h1>
            </div>


            <div className="w-full px-[24px] flex justify-center h-full items-center">
                <div className="w-full rounded-md bg-[#C7F4FE] p-[24px] max-h-max ">
                    {items.length > 0
                        ? items.map((item) => (
                            <Item
                                key={item.id}
                                item={item}
                                handlePurchase={() => handlePurchase(item)}
                                onToggle={() => onToggle(item)}
                            />
                        ))
                        : null}
                </div>
            </div>
        </div>
    );
};

const Item = ({
    item,
    handlePurchase,
    onToggle,
}: {
    item: IUserItem;
    handlePurchase: (p: IUserItem, quantity?: number) => void;
    onToggle: (p: IUserItem) => void;
}) => {
    const [quantity, setQuantity] = useState(1);

    const isDisabled = item.name !== "Abstract Halo";

    return (
        <div className="rounded-md border border-black p-4 p-[12px] relative mt-[4px]">
            {isDisabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <p className="text-white">Coming soon...</p>
                </div>
            )}
            <div className="w-full flex gap-[8px] items-center">
                <img src={`/${item.name.toLowerCase().replace(" ", "")}.jpeg`} alt={item.name} className="rounded-md border border-black w-[53px] h-[53px]" />

                <div>
                    <p>{item.name}</p>
                    <p>{item.price} ETH</p>

                    {item.type === "one-time" ? (
                        <>
                            <p>Owned: {item.quantity}</p>
                        </>
                    ) : (
                        <>
                            <p>Permanent upgrade</p>
                            {item.quantity > 0 && (
                                <div className="mt-2 w-full rounded bg-green-500 px-2 py-1 text-center text-white">
                                    Owned
                                </div>
                            )}
                        </>
                    )}
                </div>

            </div>
            {((item.type === "one-time") || (item.type === "permanent" && item.quantity === 0)) && (
                <button
                    className="mt-2 w-full rounded bg-green-500 px-2 py-1 text-white"
                    onClick={() => handlePurchase(item)}
                >
                    Buy
                </button>
            )}


            {/* <div className="w-1/5 flex items-center justify-center ">
          <img
            src={`/${powerup.name.toLowerCase().replace(" ", "")}.jpeg`}
            alt={powerup.name}
          />
        </div>
        <div className="w-3/5 text-sm">
          <p className="mb-1 text-center text-base font-semibold">
            {powerup.name}
          </p>
  
          {powerup.type === "one-time" ? (
            <>
              <p>Owned: {powerup.quantity}</p>
            </>
          ) : (
            <>
              <p>Permanent upgrade</p>
              {powerup.quantity > 0 ? (
                <div className="mt-2 w-full rounded bg-green-500 px-2 py-1 text-center text-white">
                  Owned
                </div>
              ) : (
                <button
                  className="mt-2 w-full rounded bg-green-500 px-2 py-1 text-white"
                  onClick={() => handlePurchase(powerup)}
                >
                  Buy for {powerup.price} ETH
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className="mt-2 w-full rounded bg-green-500 px-2 py-1 text-white"
            onClick={() => handlePurchase(powerup, quantity)}
          >
            Buy for {powerup.price} ETH
          </button>
          <input
            className="rounded bg-gray-200 px-2 py-1 text-center text-black"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            min={1}
            max={100}
          />
        </div>
   */}
            {/*powerup.quantity > 0 && (
          <button
            className="mt-2 max-w-min max-h-min rounded bg-blue-500 px-2 py-1 text-white"
            onClick={() => onToggle(powerup)}
          >
            {powerup.isDisabled ? "Enable" : "Disable"}
          </button>
        )*/}
        </div>
    );
};