
import React, { useState } from 'react';
import { StoreItem, ItemType } from '../types';
import { ShoppingCart, User, Image, Pill, X, AlertTriangle } from 'lucide-react';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: number;
  inventory: {
    ownedItems: string[];
    activeCharacter: string;
    activeBackground: string;
    activeDrug: string | null;
  };
  onBuy: (item: StoreItem) => void;
  onEquip: (item: StoreItem) => void;
}

export const STORE_ITEMS: StoreItem[] = [
  // --- CHARACTERS (15 Total) ---
  { id: 'char_default', name: '蒙面大盜', price: 0, type: 'CHARACTER', description: '平衡型：經典的銀行搶匪造型。' },
  { id: 'char_robot', name: '收集者 MK-II', price: 150000, type: 'CHARACTER', description: '磁力手臂：拾取範圍增加 20%。' },
  { id: 'char_alien', name: '來自火星', price: 300000, type: 'CHARACTER', description: '極速反應：移動慣性大幅降低，急停更穩。' },
  { id: 'char_banker', name: '華爾街之狼', price: 500000, type: 'CHARACTER', description: '貪婪本性：所有金錢獲得 +10% 加成。' },
  { id: 'char_ninja', name: '暗影忍者', price: 800000, type: 'CHARACTER', description: '暴擊率：10% 機率獲得雙倍獎勵。' },
  { id: 'char_pirate', name: '黑鬍子', price: 1200000, type: 'CHARACTER', description: '黃金狂熱：金條與金幣價值 +25%。' },
  { id: 'char_astro', name: '太空人', price: 2000000, type: 'CHARACTER', description: '低重力：所有物品掉落速度減緩 15%。' },
  { id: 'char_cat', name: '幸運招財貓', price: 3500000, type: 'CHARACTER', description: '強運：大幅減少大便出現機率。' },
  { id: 'char_ghost', name: '幽靈', price: 5000000, type: 'CHARACTER', description: '虛無：25% 機率直接穿過炸彈不受傷害。' },
  { id: 'char_king', name: '國王', price: 10000000, type: 'CHARACTER', description: '皇室特權：只會掉落高價值物品。' },
  
  // NEW CHARACTERS
  { id: 'char_vampire', name: '吸血伯爵', price: 6666666, type: 'CHARACTER', description: '鮮血渴望：生存模式每 10000 分回復半顆心。' },
  { id: 'char_zombie', name: '不死殭屍', price: 444444, type: 'CHARACTER', description: '腐爛身軀：被炸彈炸到不會扣血，但會扣除一半分數。' },
  { id: 'char_cyborg', name: '賽博格', price: 2500000, type: 'CHARACTER', description: '精準計算：看到所有掉落物的價值標籤。' },
  { id: 'char_wizard', name: '大魔導士', price: 8888888, type: 'CHARACTER', description: '煉金術：有機會將大便變成寶石。' },
  { id: 'char_jester', name: '宮廷小丑', price: 7777777, type: 'CHARACTER', description: '瘋狂：隨機出現極高價值物品，也可能全是炸彈。' },

  // --- BACKGROUNDS (10 Total) ---
  { id: 'bg_city', name: '罪惡城市', price: 0, type: 'BACKGROUND', description: '繁華都市的夜晚，夢想開始的地方。' },
  { id: 'bg_vault', name: '黃金金庫', price: 50000, type: 'BACKGROUND', description: '銀行深處，金光閃閃。' },
  { id: 'bg_sewer', name: '地下水道', price: 30000, type: 'BACKGROUND', description: '充滿污泥，但也有被沖走的寶藏。' },
  { id: 'bg_space', name: '外太空', price: 100000, type: 'BACKGROUND', description: '在零重力中漂浮搶劫。' },
  { id: 'bg_jungle', name: '迷失叢林', price: 40000, type: 'BACKGROUND', description: '古老遺跡中的財寶。' },
  { id: 'bg_desert', name: '法老沙漠', price: 45000, type: 'BACKGROUND', description: '金字塔下的秘密。' },
  { id: 'bg_ocean', name: '深海遺跡', price: 55000, type: 'BACKGROUND', description: '亞特蘭提斯的遺產。' },
  { id: 'bg_cyber', name: '賽博龐克', price: 88000, type: 'BACKGROUND', description: '霓虹燈下的高科技搶案。' },
  { id: 'bg_hell', name: '地獄火海', price: 66666, type: 'BACKGROUND', description: '惡魔的私房錢。' },
  { id: 'bg_snow', name: '極地冰原', price: 35000, type: 'BACKGROUND', description: '冰封的寶藏。' },

  // --- DRUGS (Expanded) ---
  { id: 'drug_speed', name: '藍色興奮劑', price: 5000, type: 'DRUG', description: '移動速度提升 50%，讓你像風一樣快。', effect: 'SPEED' },
  { id: 'drug_slow', name: '時間緩釋膠囊', price: 8000, type: 'DRUG', description: '全局時間流逝變慢，更容易看清掉落物。', effect: 'SLOW' },
  { id: 'drug_shield', name: '防護藥水', price: 15000, type: 'DRUG', description: '免疫一次大便/炸彈的傷害。', effect: 'SHIELD' },
  { id: 'drug_magnet', name: '強力磁鐵', price: 25000, type: 'DRUG', description: '自動吸附附近的金幣與寶石。', effect: 'MAGNET' },
  { id: 'drug_greed', name: '貪婪藥丸', price: 40000, type: 'DRUG', description: '獲得的所有金錢翻倍，但炸彈傷害也翻倍。', effect: 'GREED' },
  { id: 'drug_alchemy', name: '煉金術卷軸', price: 60000, type: 'DRUG', description: '接觸大便時，將其轉化為金塊 (不會扣血)。', effect: 'ALCHEMY' },
  { id: 'drug_life', name: '備用生命針劑', price: 30000, type: 'DRUG', description: '生存模式：開局 +1 血量。限時模式：+10 秒。', effect: 'EXTRA_LIFE' },
  // NEW DRUGS
  { id: 'drug_giant', name: '巨人藥水', price: 55000, type: 'DRUG', description: '體型變大 50%，拾取判定範圍大幅增加。', effect: 'GIANT' },
  { id: 'drug_fever', name: '狂熱起手式', price: 70000, type: 'DRUG', description: '開局直接進入 20 秒的 FEVER 雙倍分數模式。', effect: 'FEVER_START' },
  { id: 'drug_frenzy', name: '金幣暴雨', price: 120000, type: 'DRUG', description: '遊戲中金幣出現率提升 3 倍。', effect: 'FRENZY' },
];

const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose, wallet, inventory, onBuy, onEquip }) => {
  const [activeTab, setActiveTab] = useState<ItemType>('CHARACTER');
  const [pendingItem, setPendingItem] = useState<StoreItem | null>(null);

  if (!isOpen) return null;

  const filteredItems = STORE_ITEMS.filter(item => item.type === activeTab);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] relative">
        
        {/* Header */}
        <div className="bg-slate-950 p-4 flex justify-between items-center border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
             <ShoppingCart className="text-purple-400" />
             <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
               黑市交易
             </h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                <span className="text-xs text-slate-400 uppercase mr-2">資金</span>
                <span className="text-green-400 font-mono font-bold">${wallet.toLocaleString()}</span>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
               <X className="text-slate-400" />
             </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-900 border-b border-slate-800 shrink-0">
           <button 
             onClick={() => setActiveTab('CHARACTER')}
             className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'CHARACTER' ? 'bg-slate-800 text-yellow-400 border-b-2 border-yellow-400' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <User size={18} /> 角色 ({STORE_ITEMS.filter(i => i.type === 'CHARACTER').length})
           </button>
           <button 
             onClick={() => setActiveTab('BACKGROUND')}
             className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'BACKGROUND' ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <Image size={18} /> 場景 ({STORE_ITEMS.filter(i => i.type === 'BACKGROUND').length})
           </button>
           <button 
             onClick={() => setActiveTab('DRUG')}
             className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'DRUG' ? 'bg-slate-800 text-red-500 border-b-2 border-red-500' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <Pill size={18} /> 藥劑
           </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-900/50">
           {filteredItems.map(item => {
              const isOwned = inventory.ownedItems.includes(item.id);
              const isEquipped = inventory.activeCharacter === item.id || inventory.activeBackground === item.id;
              const isActiveDrug = inventory.activeDrug === item.effect; 
              const canAfford = wallet >= item.price;
              
              return (
                <div key={item.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-col hover:border-slate-500 transition-all group relative">
                   
                   <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-white group-hover:text-yellow-400 transition-colors truncate pr-2">{item.name}</h3>
                      {item.type !== 'DRUG' && isEquipped && <span className="shrink-0 text-[10px] bg-green-900/80 text-green-300 px-2 py-0.5 rounded border border-green-700">裝備中</span>}
                      {item.type === 'DRUG' && isActiveDrug && <span className="shrink-0 text-[10px] bg-red-900/80 text-red-300 px-2 py-0.5 rounded border border-red-700 animate-pulse">已激活</span>}
                   </div>
                   
                   <p className="text-slate-400 text-xs mb-4 flex-1 leading-relaxed border-t border-slate-700/50 pt-2 mt-1">
                     {item.description}
                   </p>
                   
                   <div className="mt-auto flex items-center justify-between">
                      <span className="font-mono text-yellow-500 font-bold text-sm">
                        {item.price > 0 ? `$${item.price.toLocaleString()}` : '免費'}
                      </span>
                      
                      {item.type === 'DRUG' ? (
                         <button
                           disabled={!canAfford && !isActiveDrug}
                           onClick={() => {
                              if (!isActiveDrug) setPendingItem(item);
                           }}
                           className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                             isActiveDrug 
                               ? 'bg-slate-700 text-slate-400 cursor-default'
                               : canAfford 
                                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 active:scale-95'
                                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                           }`}
                         >
                            {isActiveDrug ? '準備就緒' : '購買一次'}
                         </button>
                      ) : (
                        isOwned ? (
                          <button 
                            onClick={() => onEquip(item)}
                            disabled={isEquipped}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                isEquipped 
                                ? 'bg-slate-700 text-slate-400 cursor-default' 
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-95'
                            }`}
                          >
                             {isEquipped ? '已裝備' : '裝備'}
                          </button>
                        ) : (
                          <button 
                             onClick={() => {
                                 setPendingItem(item);
                             }}
                             disabled={!canAfford}
                             className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                canAfford 
                                ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20 active:scale-95' 
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                             }`}
                          >
                             購買
                          </button>
                        )
                      )}
                   </div>
                </div>
              );
           })}
        </div>

        {/* Confirmation Overlay */}
        {pendingItem && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                   <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                      <AlertTriangle className="text-red-500" size={32} />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">確認購買?</h3>
                   <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                      您確定要花費 <span className="text-yellow-400 font-bold">${pendingItem.price.toLocaleString()}</span> 購買 <span className="text-white font-bold">{pendingItem.name}</span> 嗎?
                      {pendingItem.type === 'DRUG' && (
                         <span className="text-red-400 font-bold block mt-2 bg-red-900/20 p-2 rounded">
                            注意：此藥劑為一次性消耗品，將在下一局自動使用。
                         </span>
                      )}
                   </p>
                   
                   <div className="grid grid-cols-2 gap-3 w-full">
                      <button 
                         onClick={() => setPendingItem(null)}
                         className="py-3 px-4 rounded-xl font-bold text-slate-400 bg-slate-900 hover:bg-slate-700 transition-colors"
                      >
                         取消
                      </button>
                      <button 
                         onClick={() => {
                            onBuy(pendingItem);
                            setPendingItem(null);
                         }}
                         className="py-3 px-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/20 transition-all active:scale-95"
                      >
                         確認購買
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ShopModal;
