import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, View, Image, Text } from "react-native";
import { Zap } from 'lucide-react-native';

type Promo = {
    id: number;
    color: string;
    imageUrl: string;
    tag?: string;
    title: string;
}

type PromoCardProps = {
    promo: Promo
}

export function PromoCard({promo}: PromoCardProps){
    return(
        <Pressable
            className="bg-white rounded-3xl overflow-hidden border border-gray-100"
            style={{
              width: 220,
              elevation: 3,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            <View
              className="h-36 items-center justify-center relative"
              style={{ backgroundColor: promo.color }}
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.45)']}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 }}
              />
              <Image
                source={{ uri: promo.imageUrl }}
                style={{ width: '100%', height: 144 }}
                resizeMode="cover"
              />

              {promo.tag && (
                <View className="absolute top-3 flex-row gap-x-1 left-3 bg-orange-600 rounded-lg px-2.5 py-1">
                  <Zap size={9} color="#f59e0b" fill="#f59e0b" />
                  <Text
                    className="text-white font-semibold"
                    style={{ fontSize: 9, fontFamily: 'SofiaProBold' }}
                  >
                    {promo.tag}
                  </Text>
                </View>
              )}
            </View>

            <View className="px-3.5 py-3 gap-y-1">
              <Text className="text-sm font-bold text-gray-900" numberOfLines={1} >
                {promo.title}
              </Text>

              <View className="flex-row items-center gap-x-1">
                <Ionicons name="star" size={14} color="#FF7622" />
                <Text  className="text-sm text-gray-700" style={{fontFamily: 'SofiaProBold' }}>4.8</Text>
                <Text className="text-sm text-gray-300">·</Text>
                <Ionicons name="bicycle-outline" size={14} color="#6b7280" />
                <Text className="text-sm text-gray-500">20–35 min</Text>
              </View>

{/*               <View className="flex-row items-center justify-between mt-1">
                <Text className="text-xs text-green-600 font-semibold">Entrega grátis</Text>
                <Text className="text-sm font-bold" style={{ color: '#EA1D2C' }}>R$ {promo.price}</Text>
              </View> */}
            </View>
          </Pressable>
    )
}