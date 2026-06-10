import React from "react";
import ReactECharts from "echarts-for-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ApplicationData {
    name: string;
    applied: number;
    screening: number;
    interview: number;
    hired: number;
    rejected: number;
}

interface ApplicationChartProps {
    applicationData: ApplicationData[];
}

const ApplicationChart: React.FC<ApplicationChartProps> = ({ applicationData }) => {
    const colorPalette = {
        applied: "#3B82F6",       // Vibrant blue
        screening: "#eeb10e",      // Emerald green
        interview: "#8B5CF6",      // Deep purple
        hired: "#22C55E",          // Bright green
        rejected: "#EF4444",
        axis:'#000'        // Vivid red
    };

    const option = {
        color: Object.values(colorPalette),
        tooltip: { 
            trigger: "axis",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderColor: "#e0e0e0",
            textStyle: {
                color: "#333",
                fontSize: 12
            },
            axisPointer: {
                type: "shadow",
                shadowStyle: {
                    color: "rgba(0, 0, 0, 0.05)"
                }
            }
        },
        toolbox: {
            show: true,
            orient: 'vertical',
            left: 'right',
            top: 'center',
            feature: {
              mark: { show: true },
              dataView: { show: true, readOnly: false },
              magicType: { show: true, type: ['line', 'bar', 'stack'] },
              saveAsImage: { show: true }
            }
          },
        legend: {
            data: ["Applied", "Screening", "Interview", "Hired", "Rejected"],
            top: "top",
            right: "left",
            textStyle: { 
                fontSize: 12,
                color: "#666"
            },
            itemWidth: 15,
            itemHeight: 10,
            itemGap: 10
        },
        grid: { 
            left: "12%", 
            right: "8%", 
            bottom: "12%", 
            top: "15%", 
            containLabel: true,
            backgroundColor: "rgba(240, 240, 240, 0.1)"
        },
        xAxis: {             
            type: "category",             
            name: "Months",  
            boundaryGap: false,           
           
            nameLocation: "middle",             
            nameGap: 30,             
            data: applicationData.map((item) => item.name),             
            axisLine: {                  
                lineStyle: {                      
                    color: "gray",                     
                    width: 1.5                 
                }              
            },             
            axisLabel: {                  
                fontSize: 12,                 
                color: "gray",
                interval: 0,             
            },             
            splitLine: {                 
                show: true,                 
                lineStyle: {                     
                    color: "rgba(0, 0, 0, 0.05)",                     
                    type: "dashed"                 
                }             
            }         
        },         
        yAxis: {             
            type: "value",             
            name: "Number of Applications",             
            nameLocation: "middle",             
            nameGap: 40,             
            axisLine: {                  
                lineStyle: {                      
                    color: "gray",                     
                    width: 1.5                 
                }              
            },             
            axisLabel: {                  
                fontSize: 12,                 
                color: "gray"           
            },             
            splitLine: {                 
                lineStyle: {                     
                    color: "rgba(0, 0, 0, 0.05)",                     
                    type: "dashed"                 
                }             
            }         
        },
        series: [
            {
                name: "Applied",
                type: "line",
                data: applicationData.map((item) => item.applied),
                itemStyle: { 
                    color: colorPalette.applied,
                    borderRadius: 5
                },
                smooth: 0.3,
                lineStyle: {
                    width: 3
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 0, color: colorPalette.applied // color at the start
                        }, {
                            offset: 1, color: 'rgba(59, 130, 246, 0.1)' // color at the end
                        }],
                    }
                }
            },
            {
                name: "Screening",
                type: "line",
                data: applicationData.map((item) => item.screening),
                itemStyle: { 
                    color: colorPalette.screening,
                    borderRadius: 5
                },
                smooth: 0.3,
                lineStyle: {
                    width: 3
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 0, color: colorPalette.screening
                        }, {
                            offset: 1, color: 'rgba(16, 185, 129, 0.1)'
                        }],
                    }
                }
            },
            {
                name: "Interview",
                type: "line",
                data: applicationData.map((item) => item.interview),
                itemStyle: { 
                    color: colorPalette.interview,
                    borderRadius: 5
                },
                smooth: 0.3,
                lineStyle: {
                    width: 3
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 0, color: colorPalette.interview
                        }, {
                            offset: 1, color: 'rgba(139, 92, 246, 0.1)'
                        }],
                    }
                }
            },
            {
                name: "Hired",
                type: "line",
                data: applicationData.map((item) => item.hired),
                itemStyle: { 
                    color: colorPalette.hired,
                    borderRadius: 5
                },
                smooth: 0.3,
                lineStyle: {
                    width: 3
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 0, color: colorPalette.hired
                        }, {
                            offset: 1, color: 'rgba(34, 197, 94, 0.1)'
                        }],
                    }
                }
            },
            {
                name: "Rejected",
                type: "line",
                data: applicationData.map((item) => item.rejected),
                itemStyle: { 
                    color: colorPalette.rejected,
                    borderRadius: 5
                },
                smooth: 0.3,
                lineStyle: {
                    width: 3
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 0, color: colorPalette.rejected
                        }, {
                            offset: 1, color: 'rgba(239, 68, 68, 0.1)'
                        }],
                    }
                }
            }
        ],
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicInOut'
    };

    return (
        <Card >
            <CardHeader >
                <CardTitle >Application Trends</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
                <div className="h-64 w-full">
                    <ReactECharts option={option} style={{ width: "100%", height: "100%" }} />
                </div>
            </CardContent>
        </Card>
    );
};

export default ApplicationChart;