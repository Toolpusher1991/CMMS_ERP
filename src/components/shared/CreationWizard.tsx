import { useState, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Zap,
  Wrench,
  Shield,
  MoreHorizontal,
  Settings,
  Cog,
  HardDrive,
  Triangle,
  RotateCw,
  Layers,
  Gauge,
  Cylinder,
  ArrowDown,
  Minus,
  ArrowUp,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───
export interface WizardCard {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface WizardStep {
  id: string;
  title: string;
  subtitle: string;
  cards: WizardCard[];
  multiSelect?: boolean;
}

export interface WizardSelections {
  [stepId: string]: string | string[];
}

interface CreationWizardProps {
  steps: WizardStep[];
  onComplete: (selections: WizardSelections) => void;
  onCancel: () => void;
  /** Content to render after the last card step (e.g. form fields) */
  finalStepContent?: (selections: WizardSelections) => React.ReactNode;
  finalStepTitle?: string;
  finalStepSubtitle?: string;
  isSubmitting?: boolean;
}

// ─── Preset data ───

export const DISCIPLINE_CARDS: WizardCard[] = [
  {
    id: "ELEKTRIK",
    label: "Elektrik",
    description: "Elektrische Systeme & Steuerungen",
    icon: <Zap className="h-7 w-7" />,
  },
  {
    id: "MECHANIK",
    label: "Mechanik",
    description: "Mechanische Komponenten & Antriebe",
    icon: <Wrench className="h-7 w-7" />,
  },
  {
    id: "WELL_CONTROL",
    label: "Well Control",
    description: "BOP, Choke & Kill Systeme",
    icon: <Shield className="h-7 w-7" />,
  },
  {
    id: "HYDRAULIK",
    label: "Hydraulik",
    description: "Hydraulische Systeme & Leitungen",
    icon: <Settings className="h-7 w-7" />,
  },
  {
    id: "SONSTIGES",
    label: "Sonstiges",
    description: "Weitere Bereiche & Allgemein",
    icon: <MoreHorizontal className="h-7 w-7" />,
  },
];

export const PRIORITY_CARDS: WizardCard[] = [
  {
    id: "LOW",
    label: "Niedrig",
    description: "Kann warten, kein Zeitdruck",
    icon: <ArrowDown className="h-7 w-7" />,
  },
  {
    id: "MEDIUM",
    label: "Mittel",
    description: "Normale Bearbeitungszeit",
    icon: <Minus className="h-7 w-7" />,
  },
  {
    id: "HIGH",
    label: "Hoch",
    description: "Zeitnah zu erledigen",
    icon: <ArrowUp className="h-7 w-7" />,
  },
  {
    id: "URGENT",
    label: "Dringend",
    description: "Sofortige Bearbeitung nötig",
    icon: <AlertTriangle className="h-7 w-7" />,
  },
];

export const COMPONENT_CARDS: WizardCard[] = [
  {
    id: "MUD_PUMPS",
    label: "Mud Pumps",
    description: "Spülungspumpen & Zubehör",
    icon: <Gauge className="h-7 w-7" />,
  },
  {
    id: "GENERATORS",
    label: "Generatoren",
    description: "Stromerzeugung & Verteilung",
    icon: <Zap className="h-7 w-7" />,
  },
  {
    id: "TOP_DRIVE",
    label: "Top Drive",
    description: "Oberer Antrieb & Spindel",
    icon: <RotateCw className="h-7 w-7" />,
  },
  {
    id: "DRAWWORKS",
    label: "Hebewerk",
    description: "Drawworks & Bremssysteme",
    icon: <Layers className="h-7 w-7" />,
  },
  {
    id: "BOP",
    label: "BOP Stack",
    description: "Blowout Preventer & Steuerung",
    icon: <Shield className="h-7 w-7" />,
  },
  {
    id: "ROTARY_TABLE",
    label: "Drehtisch",
    description: "Rotary Table & Master Bushing",
    icon: <Cog className="h-7 w-7" />,
  },
  {
    id: "IRON_ROUGHNECK",
    label: "Iron Roughneck",
    description: "Rohrzangen & Drehmoment",
    icon: <Wrench className="h-7 w-7" />,
  },
  {
    id: "SCR_HOUSE",
    label: "SCR / VFD House",
    description: "Frequenzumrichter & Steuerung",
    icon: <HardDrive className="h-7 w-7" />,
  },
  {
    id: "MAST_SUBSTRUCTURE",
    label: "Mast / Substruktur",
    description: "Turmaufbau & Unterbau",
    icon: <Triangle className="h-7 w-7" />,
  },
  {
    id: "PIPE_HANDLING",
    label: "Pipe Handling",
    description: "Rohrhandling & Catwalk",
    icon: <Cylinder className="h-7 w-7" />,
  },
];

// ─── Component ───

export function CreationWizard({
  steps,
  onComplete,
  onCancel,
  finalStepContent,
  finalStepTitle,
  finalStepSubtitle,
  isSubmitting,
}: CreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<WizardSelections>({});

  const totalSteps = steps.length + (finalStepContent ? 1 : 0);
  const isOnFinalStep = finalStepContent ? currentStep === steps.length : false;
  const isOnCardStep = currentStep < steps.length;

  const activeStep = isOnCardStep ? steps[currentStep] : null;
  const currentSelection = activeStep ? selections[activeStep.id] : null;

  const canGoNext = isOnCardStep
    ? currentSelection !== undefined &&
      currentSelection !== null &&
      (Array.isArray(currentSelection)
        ? currentSelection.length > 0
        : currentSelection !== "")
    : true;

  const handleSelect = useCallback(
    (cardId: string) => {
      if (!activeStep) return;
      if (activeStep.multiSelect) {
        const current = (selections[activeStep.id] as string[]) || [];
        const updated = current.includes(cardId)
          ? current.filter((id) => id !== cardId)
          : [...current, cardId];
        setSelections({ ...selections, [activeStep.id]: updated });
      } else {
        setSelections({ ...selections, [activeStep.id]: cardId });
      }
    },
    [activeStep, selections],
  );

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(selections);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onCancel();
    }
  };

  const isSelected = (cardId: string) => {
    if (!activeStep) return false;
    const sel = selections[activeStep.id];
    return Array.isArray(sel) ? sel.includes(cardId) : sel === cardId;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="px-6 pt-5 pb-2">
        <div className="flex items-center gap-2 mb-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= currentStep ? "bg-[#00B2E3]" : "bg-[#C8C8D2]/30",
              )}
            />
          ))}
        </div>
        <p className="text-[11px] uppercase tracking-[1.4px] font-medium text-[#64646E]">
          Schritt {currentStep + 1} von {totalSteps}
        </p>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isOnCardStep && activeStep && (
          <>
            <h2 className="text-[22px] font-medium text-[#143269] tracking-[-0.2px] mb-1">
              {activeStep.title}
            </h2>
            <p className="text-[13px] text-[#64646E] mb-5">
              {activeStep.subtitle}
            </p>
            <div
              className={cn(
                "grid gap-3",
                activeStep.cards.length <= 4
                  ? "grid-cols-2"
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
              )}
            >
              {activeStep.cards.map((card) => {
                const selected = isSelected(card.id);
                return (
                  <button
                    key={card.id}
                    onClick={() => handleSelect(card.id)}
                    className={cn(
                      "relative flex flex-col items-center text-center p-5 border transition-all duration-150",
                      "rounded-sm hover:shadow-md focus:outline-none",
                      "min-h-[130px] justify-center gap-2",
                      selected
                        ? "border-[#00B2E3] bg-[#00B2E3]/5 shadow-[0_0_0_1px_#00B2E3]"
                        : "border-[#C8C8D2] bg-white hover:border-[#2B5597]",
                    )}
                  >
                    {/* Selection indicator */}
                    {selected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#00B2E3] flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {/* Icon */}
                    {card.icon && (
                      <div
                        className={cn(
                          "w-12 h-12 rounded-sm flex items-center justify-center mb-1",
                          selected
                            ? "bg-[#00B2E3]/15 text-[#00B2E3]"
                            : "bg-[#F0F0FA] text-[#143269]",
                        )}
                      >
                        {card.icon}
                      </div>
                    )}
                    <span
                      className={cn(
                        "text-[14px] font-medium leading-tight",
                        selected ? "text-[#143269]" : "text-[#000]",
                      )}
                    >
                      {card.label}
                    </span>
                    {card.description && (
                      <span className="text-[11px] text-[#64646E] leading-snug">
                        {card.description}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {isOnFinalStep && finalStepContent && (
          <>
            {finalStepTitle && (
              <h2 className="text-[22px] font-medium text-[#143269] tracking-[-0.2px] mb-1">
                {finalStepTitle}
              </h2>
            )}
            {finalStepSubtitle && (
              <p className="text-[13px] text-[#64646E] mb-5">
                {finalStepSubtitle}
              </p>
            )}
            {finalStepContent(selections)}
          </>
        )}
      </div>

      {/* Footer navigation */}
      <div className="border-t border-[#C8C8D2]/40 px-6 py-4 flex justify-between gap-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-5 py-2.5 text-[12px] uppercase tracking-[1.4px] font-medium text-[#143269] border border-[#C8C8D2] rounded-sm hover:bg-[#F0F0FA] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </button>
        <button
          onClick={handleNext}
          disabled={!canGoNext || isSubmitting}
          className={cn(
            "flex items-center gap-1.5 px-5 py-2.5 text-[12px] uppercase tracking-[1.4px] font-medium rounded-sm transition-colors",
            canGoNext && !isSubmitting
              ? "bg-[#143269] text-white hover:bg-[#2B5597]"
              : "bg-[#C8C8D2]/30 text-[#C8C8D2] cursor-not-allowed",
          )}
        >
          {isOnFinalStep ||
          (!finalStepContent && currentStep === steps.length - 1) ? (
            isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Wird gespeichert...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Fertig
              </>
            )
          ) : (
            <>
              Weiter
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
