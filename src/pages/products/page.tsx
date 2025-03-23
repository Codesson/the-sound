import React, { useState } from "react";
import speakerImage from "../../assets/images/speaker.png";
import videoImage from "../../assets/images/3d-video.png";
import spotlightsImage from "../../assets/images/spotlights.png";
import ledImage from "../../assets/images/led.png";

type ItemModel = {
  model: string;
  url: string;
  alt: string;
  kind: string;
  desc: string;
  spec?: Record<string, string> | undefined;
};

export default function Products() {
  const productsList: ItemModel[] = [
    {
      model: "E212",
      kind: `메인 스피커`,
      url: speakerImage,
      alt: "메인 스피커",
      desc: 'E212 스피커는 유수한 스피커제조사들이 사용하는 B&C(ITALY) SPEAKER를 시작으로 CROSSOVER NETWORK 부품엔 hi-end 스피커 제조사들이 사용하는 JANTZEN(DENMARK)사의 MOX RESISTANCE, CAPACITOR, AIR CORE COIL을 사용하여 ANALOGUE 사운드를 추구하였고, 스피커 내부에 사용되는 케이블 역시 hi-end 스피커 제조사들이 사용하는 NEOTECH(TAIWAN)사의 케이블을 사용하여 좋은 소리를 위해서 과감한 물량으로 제조 되었습니다. 물량뿐 아니라 음향학적 이론의 토대 위의 허용 가능한 수정을 하기 위해, 음향 관련 현직에서 일하고 계시는 교수님들과 음향 감독님들과의 수 없는 현장에서의 데모를 통해 2년 이라는 개발기간을 거치며 4번의 ENCLOSER 수정, 6번의 CROSSOVER NETWORK수정을 거쳐 마침내 MADE IN KOREA 스피커인 E212가 나오게 되었습니다.\n 좋은 소리를 위해 많은 비용이 필요한 현실에서 E212는 좋은 대안이 되어 줄 것입니다.',
      spec: {
        'TYPE': "2WAY PASSIVE SPEAKER",
        'COMPONENTS': `LOW: 2 X 12" 3" VOICE COIL (B&C)
        HI: 1 X 1.4" 3" VOICE COIL (B&C) COAXIAL
        CROSSOVER NETWORK (JANTZEN)
        `,
        "FREQUENCY RESPONSE": "45HZ - 18,000HZ",
        "POWER HANDLING CAPACITY(PROGRAM/PEAK)": '1400/2800',
        'NOMINAL IMPEDANCE': '40HM',
        'COVERAGE(HXV)': '60° X 40° OR 40° X 60° HF-HORN ROTATABLE',
        "SPLmax/1m": "137dB",
        "SENSITIVITY(1W/1M)": '109dB',
        'CONNECTION': '2 X NL4 1$',
        'ENCLOSER': '15mm BALTIC PLYWOOD',
        'FINISH': 'WARNEX TEXTURE PAINT (BLACK OR WHITE)',
        'DIMENSIONS(H X W X D)': '700 X 450 X 430',
        'WEIGHT': '40KG'
      }
    },
    {
      model: "TS M12",
      kind: `12인치 모니터`,
      url: videoImage,
      alt: "",
      desc: '',
      spec: undefined
    },
    {
      model: "E12",
      kind: `딜레이 스피커`,
      url: spotlightsImage,
      alt: "",
      desc: '',
      spec: undefined
    },
    {
      model: "S218",
      kind: `서브우퍼`,
      url: ledImage,
      alt: "",
      desc: '',
      spec: undefined
    },
  ];

  const [selectedItem, setSelectedItem] = useState<ItemModel | null>(null);

  const selectItem = (index: number) => {
    setSelectedItem(productsList[index]);
  };

  return (
    <section className="pt-[70px] min-h-[100vh]">
      <h2 className="text-center">제품소개</h2>
      <div className="sub-title my-4 text-xl text-center">
        최고의 기술로 국내 직접 생산
      </div>
      <div className="flex gap-4 my-20 justify-center">
        {productsList.map((part, index) => (
          <div
            key={index}
            className="flex flex-col w-[250px] items-center cursor-pointer"
            onClick={() => selectItem(index)}
          >
            <div className="bg-white">
              <img src={part.url} width={200} height={200} alt={part.alt || part.model} style={{ width: '200px', height: '200px' }} />
            </div>
            <div>{part.model}</div>
            <div className="">{part.kind}</div>
          </div>
        ))}
      </div>
      {
        selectedItem ? (<div className="pt-40 px-[10%]">
          <div className="flex flex-row justify-center p-4 bg-slate-700">
            <div className="flex-1 flex flex-col gap-8 justify-start items-center">
              <h4>{selectedItem?.model}({selectedItem?.kind})</h4>
              <img width={400} height={400} src={selectedItem?.url} alt={selectedItem?.alt} style={{ width: '400px', height: '400px' }} />
            </div>
            <div className="flex-1">
              <table>
                <tbody>
                {selectedItem?.spec && Object.entries(selectedItem?.spec).map(([key, value]) => (
                  <tr key={key}>
                    <td className="px-1 text-left">{key}</td>
                    <td className="px-1 text-left">{value}</td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-10 leading-[2] text-xl  bg-slate-700 text-left">
            {selectedItem.desc}
          </div>
        </div>): <div></div>
      }
    </section>
  );
}
