// utils/applications.ts
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
        case "applied": return "bg-yellow-100 text-yellow-800";
        case "screening": return "bg-blue-100 text-blue-800";
        case "interview": return "bg-purple-100 text-purple-800";
        case "hired": return "bg-green-100 text-green-800";
        case "rejected": return "bg-red-100 text-red-800";
        default: return "bg-gray-100 text-gray-800";
    }
};


export const getSimilarityInfo = (score: number) => {
    if (score >= 80) return { color: "text-green-600", bgColor: "bg-green-600" };
    if (score >= 60) return { color: "text-blue-600", bgColor: "bg-blue-600" };
    if (score >= 40) return { color: "text-yellow-600", bgColor: "bg-yellow-600" };
    return { color: "text-red-600", bgColor: "bg-red-600" };
};