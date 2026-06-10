"use client"
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button"; // Using shadcn/ui for styling

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    errorMessage: string;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, errorMessage: "" };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, errorMessage: error.message };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Error Boundary Caught:", error, errorInfo);
        // You can integrate with a logging service here (e.g., LogRocket, Datadog, or a custom API)
    }

    handleReload = () => {
        this.setState({ hasError: false, errorMessage: "" });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-900 p-6">
                    <h2 className="text-2xl font-semibold mb-4">Oops! Something went wrong</h2>
                    <p className="text-md text-gray-600 mb-6">{this.state.errorMessage || "An unexpected error occurred."}</p>
                    <Button onClick={this.handleReload} className="px-6 py-2 text-white bg-red-600 hover:bg-red-700">
                        Reload Page
                    </Button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
