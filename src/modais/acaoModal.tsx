import { Bot, CalendarDays, Clock3, MessageSquareText, Trash2, X } from "lucide-react-native";
import React from "react";
import { Modal, Pressable, View, Text } from "react-native";

type AcaoModalProps = {
    visible: boolean;
    message: string;
    time: string;
    dataFormatada: string;
    onClose: () => void;
    onDelete: () => void;
}

function AcaoModalComponent({ visible, onClose, onDelete, message, time, dataFormatada }: AcaoModalProps) {
    // console.log('Renderizou AcaoModal', {
    //     visible,
    //     onClose,
    //     onDelete,
    //     message,
    //     time,
    //     dataFormatada
    // });
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center bg-black/45 px-5">
                <Pressable className="absolute inset-0" onPress={onClose} />

                <View className="w-full overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-sm">
                    <View className="border-b border-slate-200 px-5 pb-4 pt-5">
                        <View className="flex-row items-start justify-between">
                            <View className="mr-3 flex-1 flex-row items-center">
                                <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50">
                                    <Bot size={20} color="#128C7E" />
                                </View>

                                <View className="flex-1">
                                    <Text className="text-lg font-extrabold tracking-wide text-slate-900">
                                        Detalhes do lembrete
                                    </Text>
                                </View>
                            </View>

                            <Pressable
                                onPress={onClose}
                                hitSlop={8}
                                className="h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white"
                            >
                                <X size={16} color="#475569" />
                            </Pressable>
                        </View>
                    </View>

                    <View className="gap-4 px-5 py-5">
                        <View className="rounded-2xl border border-slate-200 bg-white p-4">
                            <View className="mb-2 flex-row items-center">
                                <MessageSquareText size={15} color="#4F46E5" />
                                <Text className="ml-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                    Comando
                                </Text>
                            </View>
                            <Text className="text-base font-bold leading-6 text-slate-900">
                                {message}
                            </Text>
                        </View>

                        <View className="rounded-2xl border border-slate-200 bg-white p-4">
                            <View className="flex-row items-center justify-between">
                                <View className="mr-2 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                    <View className="mb-1 flex-row items-center">
                                        <CalendarDays size={14} color="#0284C7" />
                                        <Text className="ml-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                            Data
                                        </Text>
                                    </View>
                                    <Text className="text-sm font-semibold text-slate-800">
                                        {dataFormatada}
                                    </Text>
                                </View>

                                <View className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                    <View className="mb-1 flex-row items-center">
                                        <Clock3 size={14} color="#CA8A04" />
                                        <Text className="ml-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                            Horario
                                        </Text>
                                    </View>
                                    <Text className="text-sm font-semibold text-slate-800">
                                        {time}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View className="mt-1 flex-row gap-3">
                            <Pressable
                                onPress={onClose}
                                className="flex-1 items-center rounded-2xl border border-slate-300 bg-slate-100 py-3"
                            >
                                <Text className="text-sm font-bold text-slate-700">Fechar</Text>
                            </Pressable>

                            <Pressable
                                onPress={onDelete}
                                className="flex-1 flex-row items-center justify-center rounded-2xl bg-red-600 py-3"
                            >
                                <Trash2 size={14} color="#FFFFFF" />
                                <Text className="ml-2 text-sm font-bold text-white">Deletar</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export const AcaoModal = React.memo(AcaoModalComponent);