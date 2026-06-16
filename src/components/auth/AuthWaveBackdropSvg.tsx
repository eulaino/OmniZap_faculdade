import Svg, { Circle, G, Path } from 'react-native-svg';

type AuthWaveBackdropSvgProps = {
  width?: number;
  height?: number;
};

export function AuthWaveBackdropSvg({ width = 393, height = 627 }: AuthWaveBackdropSvgProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 393 627" fill="none" preserveAspectRatio="none">
      <Path
        d="M0 462C42 448 79 442 118 454C158 466 181 498 219 520C264 546 316 556 393 528V0H0V462Z"
        fill="#128C7E"
      />

      <G opacity="0.22">
        <Path
          d="M-21 48C9 14 49 16 69 44C86 68 64 92 34 85C5 78 -9 100 7 121C26 147 74 148 98 121C122 94 103 71 78 75"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <Path
          d="M-13 98C28 54 89 55 121 94C149 128 124 169 78 168C44 167 30 190 50 210C77 238 132 223 151 188C170 153 148 127 121 131"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <Path
          d="M112 -11C156 41 226 39 248 -2M139 -17C173 18 221 18 235 -9"
          stroke="#FFFFFF"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <Path
          d="M144 151C185 117 252 118 286 153C318 186 300 232 253 241C217 248 207 278 235 295C273 318 335 287 342 241"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <Path
          d="M170 178C198 154 244 153 265 177C284 199 273 224 245 229C222 233 218 250 236 260"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <Path
          d="M288 41C327 7 377 8 405 38M287 70C326 44 374 45 401 69M303 96C334 78 373 80 395 101"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <Path
          d="M-18 290C37 243 109 248 157 295C196 333 235 344 292 318C335 298 374 306 411 340"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <Path
          d="M-9 328C48 285 108 292 147 332C184 370 234 382 286 353C329 329 365 337 397 365"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <Path
          d="M37 372C87 342 126 355 163 390C198 422 242 433 291 405"
          stroke="#FFFFFF"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <Path
          d="M318 153C348 120 392 123 410 156M332 178C352 157 383 158 399 178"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <Path
          d="M191 63C207 41 244 43 257 67C271 94 248 120 218 111C190 103 178 81 191 63Z"
          stroke="#FFFFFF"
          strokeWidth="1.3"
        />
        <Path
          d="M210 76C220 63 241 64 248 78C256 93 242 105 225 101C209 97 202 87 210 76Z"
          stroke="#FFFFFF"
          strokeWidth="1.2"
        />
        <Path
          d="M70 244C89 219 130 222 143 249C157 279 129 304 97 292C71 283 58 260 70 244Z"
          stroke="#FFFFFF"
          strokeWidth="1.3"
        />
        <Path
          d="M88 258C99 244 122 245 130 260C138 276 122 290 104 284C89 279 81 268 88 258Z"
          stroke="#FFFFFF"
          strokeWidth="1.2"
        />
      </G>

      <G opacity="0.16">
        <Circle cx="46" cy="111" r="19" stroke="#FFFFFF" strokeWidth="1.4" />
        <Circle cx="321" cy="299" r="3" fill="#FFFFFF" />
        <Circle cx="264" cy="382" r="3" fill="#FFFFFF" />
        <Path d="M174 192L190 202L174 212L158 202L174 192Z" fill="#FFFFFF" />
        <Path d="M300 218L314 227L300 236L286 227L300 218Z" fill="#FFFFFF" />
      </G>
    </Svg>
  );
}
