import React, { useState } from "react";
import { MagiProvider } from "./components/JudgementContext/MagiContext";
import { MagiInputPage } from "./components/MagiInputPage";
import { MagiJudgmentPage } from "./components/MagiJudgmentPage";
import { MagiInput } from "./types";
import { useMagiContext } from "./components/JudgementContext/MagiContext";

function MagiPageContent() {
    const { magiState, initializeJudgment, reset } = useMagiContext();

    const handleStartJudgment = (input: MagiInput) => {
        initializeJudgment(input);
    };

    const handleBack = () => {
        reset();
    };

    if (magiState) {
        return <MagiJudgmentPage onBack={handleBack} />;
    }

    return <MagiInputPage onStartJudgment={handleStartJudgment} />;
}

export default function MagiPage() {
    return (
        <MagiProvider>
            <MagiPageContent />
        </MagiProvider>
    );
}

