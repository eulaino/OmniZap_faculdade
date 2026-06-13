import { useQuery } from "@tanstack/react-query";
import { auth } from "@/config/firebase";
import { api } from "@/services/api";
import { buscarTelefoneFirebase } from "@/utils/buscarTelefoneFirebase";


export function useDashboard() {
    const user = auth.currentUser;

    async function buscarDashboard() {
        const numero = await buscarTelefoneFirebase();

        const response = await api.get('/dashboard', {
            params: { numero },
        });
        return response.data;
    }

    return useQuery({
        queryKey: ['dashboard', user?.uid],
        queryFn: buscarDashboard,
        enabled: !!user?.uid,
        refetchOnReconnect: true,
        refetchInterval: 10000,
        refetchIntervalInBackground: false,
    });
}