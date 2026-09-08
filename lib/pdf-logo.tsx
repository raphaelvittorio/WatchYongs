import "server-only";

import { Svg, Line, Text, View } from "@react-pdf/renderer";

/**
 * Logo WatchYongs untuk dokumen PDF: dial jam bertick dengan inisial "WY" di
 * tengah. Dipakai bersama oleh invoice dan tanda terima.
 */
export function WatchLogo({ size = 40 }: { size?: number }) {
  const cx = 50;
  const cy = 50;
  const tickCount = 48;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const isCardinal = i % (tickCount / 4) === 0;
    const rad = ((i * 360) / tickCount) * (Math.PI / 180);
    const outerR = 46;
    const innerR = isCardinal ? 34 : 40;
    return (
      <Line
        key={i}
        x1={cx + outerR * Math.sin(rad)}
        y1={cy - outerR * Math.cos(rad)}
        x2={cx + innerR * Math.sin(rad)}
        y2={cy - innerR * Math.cos(rad)}
        stroke="#333333"
        strokeWidth={isCardinal ? 2.6 : 1.4}
        strokeLinecap="round"
      />
    );
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
        {ticks}
      </Svg>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: size * 0.32, fontFamily: "Helvetica-Bold" }}>WY</Text>
      </View>
    </View>
  );
}
