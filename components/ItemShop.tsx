import { useEffect, useRef, useState } from "react";
import { IItem, IUserItem } from "../utils";
import { useAtom, useSetAtom } from "jotai";
import { haloQuantityAtom, hasLuckyCharmAtom, hasSlowSkisAtom, itemsAtom, speedyStartQuantityAtom } from "@/atoms";
import PrimaryButton from "./buttons/PrimaryButton";
import { ArrowDownIcon, PlusIcon } from "./Icons";

type ItemsProps = {
  onClose: () => void;
  address: string;
  handlePurchase: (p: IUserItem, quantity?: number) => void;
};

export const ItemShop = ({
  onClose,
  address,
  handlePurchase,
}: ItemsProps) => {
  const setHaloQuantity = useSetAtom(haloQuantityAtom);
  const setHasSlowSkis = useSetAtom(hasSlowSkisAtom);
  const setHasLuckyCharm = useSetAtom(hasLuckyCharmAtom);
  const setSpeedyStartQuantity = useSetAtom(speedyStartQuantityAtom);
  const [items, setItems] = useAtom(itemsAtom)

  const onToggle = (item: IItem) => {
    setItems((prev) => {
      let newState = null;
      const newArr = prev.map((pu) => {
        if (pu.id === item.id) {
          newState = !pu.isDisabled;
          return { ...pu, isDisabled: newState };
        }
        return pu;
      });

      let localStorageDisabled = JSON.parse(
        localStorage.getItem("disabledItems") || "[]",
      ) as number[];
      if (newState) {
        localStorageDisabled.push(item.id);
      } else {
        localStorageDisabled = localStorageDisabled.filter(
          (id) => id !== item.id,
        );
      }
      localStorage.setItem(
        "disabledItems",
        JSON.stringify(localStorageDisabled),
      );

      if (item.name === "Abstract Halo") setHaloQuantity(0);
      if (item.name === "Speedy Start") setSpeedyStartQuantity(0);
      if (item.name === "Slow Skis") setHasSlowSkis(false);
      if (item.name === "Lucky Charm") setHasLuckyCharm(false);

      return newArr;
    });
  };

  const permanentItems = items.filter(item => item.type === 'permanent');
  const oneTimeItems = items.filter(item => item.type === 'one-time');

  return (
    <div style={{ background: "radial-gradient(circle, #0CBED2 0%, #0A94BC 100%)" }} className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-[402px] z-10 p-5 ">
      <div className="relative flex items-center justify-center">
        <button
          className="absolute left-0 w-[40px] h-[40px]"
          onClick={onClose}
        >
          <img src="/small-button.png" alt="bg" className="absolute top-0 left-0" />
          <img
            src="/arrow.png"
            alt="back"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10]"
          />
        </button>
        <h1 className="text-[32px] text-white text-center">Item Shop</h1>
      </div>

      <div className="mt-10 relative w-full h-[88px]">
        <img src="/button-cover.svg" className="absolute z-[9] top-[-24px] left-1/2 -translate-x-1/2  min-w-[108%]" alt="snow" />
        <div
          className="w-full text-[20px] py-3 pl-2 pr-4 rounded-sm border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)] bg-[radial-gradient(ellipse_at_center_60%,_#9E54FF_0%,_#6A00FF_100%)]"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img src="/eth-icon.png" alt="eth icon" width={38} height={38} />
              <div className="ml-1">ETH BALANCE</div>
            </div>
            <div>13.28380</div>
          </div>
        </div>
      </div>

      <div className="p-[16px] bg-[#E6FAFF] rounded-sm border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]">
        <div>PERMANENT ITEMS</div>
        {permanentItems.map((item) => (
          <Item key={item.id} item={item} handlePurchase={handlePurchase} onToggle={onToggle}/>
        ))}

        <div className="mt-4">CONSUMABLES</div>
        {oneTimeItems.map((item) => (
          <Item key={item.id} item={item} handlePurchase={handlePurchase} onToggle={onToggle}/>
        ))}
      </div>


      {/* <div className="relative">
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
      </div> */}
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
  const [expanded, setExpanded] = useState<boolean>(false);
  const contentRef = useRef(null);
  const [height, setHeight] = useState('0px');
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (expanded && contentRef.current) {
      setHeight(`${(contentRef.current as HTMLDivElement).scrollHeight}px`);
    } else {
      setHeight('0px');
    }
  }, [expanded]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity > 0) {
      setQuantity(newQuantity);
    }
  }

  return (
    <div className="mt-1 flex flex-col p-[12px] bg-[#7FCBDC] rounded-sm border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]">
      <div className="text-[16px] w-full flex justify-between items-center">
        <div className="flex w-full">
          {/* <div className="w-[53px] h-[53px] bg-[#FFF] rounded-sm border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]"> */}
            {/* Optional content */}
            <img width={53} height={53} src={item.iconPath} alt="item icon"/>
          {/* </div> */}
          <div className="ml-2">
            <div>{item.name}</div>
            <div className="flex items-center">
              <img src="/eth-icon-2.png" alt="eth icon" className="w-[15px] h-[24px]" />
              <div className="ml-1">{item.price}</div>
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex justify-center items-center w-[24px] h-[24px] p-[12px] bg-[#FFF] rounded-sm border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]"
        >
          <ArrowDownIcon
            className={`flex-shrink-0 w-[12px] h-[12px] transform transition-transform duration-300 ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      <div
        ref={contentRef}
        style={{
          maxHeight: height,
          overflow: 'hidden',
          transition: 'max-height 0.4s ease, opacity 0.3s ease',
        }}
      >
        <div className="text-[14px] mt-2 text-[#5FFF7A]">{`${item.type === 'one-time' ? '2' : ''} OWNED (MACKUP DATA)`}</div>

        <div className="mt-2 text-[14px]">{item.description}</div>
        {item.type === 'permanent' && (
          <PrimaryButton onClick={() => handlePurchase(item, quantity)} className="mt-2 w-full h-[44px]" color="green" disabled={item.quantity > 0}>
            BUY
          </PrimaryButton>
        )}
        {item.type === 'one-time' && (
          <div className="flex items-center space-x-[2px]">
            <PrimaryButton onClick={() => handlePurchase(item, quantity)} className="flex-grow mt-2 h-[44px]" color="green">
              BUY {quantity}
            </PrimaryButton>
            <PrimaryButton onClick={() => handleQuantityChange(quantity + 1)} className="mt-2 w-[44px] h-[44px]" color="green">
              +
            </PrimaryButton>
            <PrimaryButton onClick={() => handleQuantityChange(quantity - 1)} className="mt-2 w-[44px] h-[44px]" color="red">
              -
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}

// const Item = ({
//   item,
//   handlePurchase,
//   onToggle,
// }: {
//   item: IUserItem;
//   handlePurchase: (p: IUserItem, quantity?: number) => void;
//   onToggle: (p: IUserItem) => void;

// }) => {
//   const [quantity, setQuantity] = useState(1);


//   const isDisabled = item.name !== "Abstract Halo";

//   return (
//     <div className="rounded-md border border-black p-4 p-[12px] relative mt-[4px]">
//       {isDisabled && (
//         <div className="absolute inset-0 flex items-center justify-center bg-black/50">
//           <p className="text-white">Coming soon...</p>
//         </div>
//       )}
//       <div className="w-full flex gap-[8px] items-center">
//         <img src={`/${item.name.toLowerCase().replace(" ", "")}.jpeg`} alt={item.name} className="rounded-md border border-black w-[53px] h-[53px]" />

//         <div>
//           <p>{item.name}</p>
//           <p>{item.price} ETH</p>

//           {item.type === "one-time" ? (
//             <>
//               <p>Owned: {item.quantity}</p>
//             </>
//           ) : (
//             <>
//               <p>Permanent upgrade</p>
//               {item.quantity > 0 && (
//                 <div className="mt-2 w-full rounded bg-green-500 px-2 py-1 text-center text-white">
//                   Owned
//                 </div>
//               )}
//             </>
//           )}
//         </div>

//       </div>
//       {((item.type === "one-time") || (item.type === "permanent" && item.quantity === 0)) && (
//         <button
//           className="mt-2 w-full rounded bg-green-500 px-2 py-1 text-white"
//           onClick={() => handlePurchase(item)}
//         >
//           Buy
//         </button>
//       )}


//       {/* <div className="w-1/5 flex items-center justify-center ">
//           <img
//             src={`/${powerup.name.toLowerCase().replace(" ", "")}.jpeg`}
//             alt={powerup.name}
//           />
//         </div>
//         <div className="w-3/5 text-sm">
//           <p className="mb-1 text-center text-base font-semibold">
//             {powerup.name}
//           </p>
  
//           {powerup.type === "one-time" ? (
//             <>
//               <p>Owned: {powerup.quantity}</p>
//             </>
//           ) : (
//             <>
//               <p>Permanent upgrade</p>
//               {powerup.quantity > 0 ? (
//                 <div className="mt-2 w-full rounded bg-green-500 px-2 py-1 text-center text-white">
//                   Owned
//                 </div>
//               ) : (
//                 <button
//                   className="mt-2 w-full rounded bg-green-500 px-2 py-1 text-white"
//                   onClick={() => handlePurchase(powerup)}
//                 >
//                   Buy for {powerup.price} ETH
//                 </button>
//               )}
//             </>
//           )}
//         </div>
//         <div className="flex gap-2">
//           <button
//             className="mt-2 w-full rounded bg-green-500 px-2 py-1 text-white"
//             onClick={() => handlePurchase(powerup, quantity)}
//           >
//             Buy for {powerup.price} ETH
//           </button>
//           <input
//             className="rounded bg-gray-200 px-2 py-1 text-center text-black"
//             type="number"
//             value={quantity}
//             onChange={(e) => setQuantity(Number(e.target.value))}
//             min={1}
//             max={100}
//           />
//         </div>
//    */}
//       {/*powerup.quantity > 0 && (
//           <button
//             className="mt-2 max-w-min max-h-min rounded bg-blue-500 px-2 py-1 text-white"
//             onClick={() => onToggle(powerup)}
//           >
//             {powerup.isDisabled ? "Enable" : "Disable"}
//           </button>
//         )*/}
//     </div>
//   );
// };