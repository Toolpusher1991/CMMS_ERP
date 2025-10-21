import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  Settings,
  FileText,
  Download,
  Search,
  AlertCircle,
  Package,
  Zap,
  Droplets,
  Wrench,
  Truck,
  Shield,
  Users,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Types
interface ProjectRequirements {
  projectName: string;
  clientName: string;
  location: string;
  projectDuration: string;
  depth: string;
  hookLoad: string;
  footprint: "Klein" | "Mittel" | "Groß" | "";
  rotaryTorque: string;
  pumpPressure: string;
  mudWeight: string;
  casingSize: string;
  holeSize: string;
  formationPressure: string;
  additionalNotes: string;
}

interface Rig {
  id: number;
  name: string;
  category: string;
  maxDepth: number;
  maxHookLoad: number;
  footprint: string;
  rotaryTorque: number;
  pumpPressure: number;
  drawworks: string;
  mudPumps: string;
  topDrive: string;
  derrickCapacity: string;
  crewSize: string;
  mobilizationTime: string;
  dayRate: string;
  description: string;
  applications: string[];
  technicalSpecs: string;
}

interface EquipmentItem {
  id: string;
  name: string;
  price: string;
  [key: string]: string | undefined;
}

const RigConfigurator = () => {
  const { toast } = useToast();
  const [requirements, setRequirements] = useState<ProjectRequirements>({
    projectName: "",
    clientName: "",
    location: "",
    projectDuration: "",
    depth: "",
    hookLoad: "",
    footprint: "",
    rotaryTorque: "",
    pumpPressure: "",
    mudWeight: "",
    casingSize: "",
    holeSize: "",
    formationPressure: "",
    additionalNotes: "",
  });

  const [selectedRig, setSelectedRig] = useState<Rig | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<{
    [key: string]: EquipmentItem[];
  }>({
    drillPipe: [],
    tanks: [],
    power: [],
    camps: [],
    safety: [],
    mud: [],
    bop: [],
    cranes: [],
    misc: [],
  });

  // Bohranlagen Datenbank
  const rigs: Rig[] = [
    {
      id: 1,
      name: "T700",
      category: "Schwerlast",
      maxDepth: 7000,
      maxHookLoad: 700,
      footprint: "Groß",
      rotaryTorque: 85000,
      pumpPressure: 7500,
      drawworks: "2000 HP",
      mudPumps: "2x 2200 HP Triplex",
      topDrive: "1000 HP",
      derrickCapacity: "1000 t",
      crewSize: "45-50",
      mobilizationTime: "30-45 Tage",
      dayRate: "85000",
      description:
        "Hochleistungs-Bohranlage für Tiefbohrungen und extreme Lasten",
      applications: ["Tiefbohrungen", "Offshore", "Hochdruck-Formationen"],
      technicalSpecs:
        "API 4F Zertifizierung, DNV-GL Standard, vollautomatisches Pipe Handling",
    },
    {
      id: 2,
      name: "T46",
      category: "Schwerlast",
      maxDepth: 6000,
      maxHookLoad: 460,
      footprint: "Groß",
      rotaryTorque: 65000,
      pumpPressure: 7000,
      drawworks: "1500 HP",
      mudPumps: "2x 1600 HP Triplex",
      topDrive: "750 HP",
      derrickCapacity: "650 t",
      crewSize: "40-45",
      mobilizationTime: "25-35 Tage",
      dayRate: "65000",
      description:
        "Vielseitige Schwerlast-Bohranlage für mittlere bis tiefe Bohrungen",
      applications: [
        "Mittlere Tiefbohrungen",
        "Onshore",
        "Standardformationen",
      ],
      technicalSpecs: "API 8C Zertifizierung, automatisches Roughneck System",
    },
    {
      id: 3,
      name: "T350",
      category: "Mittlere Leistung",
      maxDepth: 4500,
      maxHookLoad: 350,
      footprint: "Mittel",
      rotaryTorque: 45000,
      pumpPressure: 5500,
      drawworks: "1200 HP",
      mudPumps: "2x 1200 HP Triplex",
      topDrive: "500 HP",
      derrickCapacity: "450 t",
      crewSize: "30-35",
      mobilizationTime: "20-25 Tage",
      dayRate: "48000",
      description: "Ausgewogene Lösung für mittlere Bohrtiefen",
      applications: ["Mittlere Bohrungen", "Onshore", "Vielseitig einsetzbar"],
      technicalSpecs: "Kompaktes Design, modularer Aufbau",
    },
    {
      id: 4,
      name: "T208",
      category: "Kompakt",
      maxDepth: 3000,
      maxHookLoad: 208,
      footprint: "Klein",
      rotaryTorque: 28000,
      pumpPressure: 4500,
      drawworks: "750 HP",
      mudPumps: "1x 1000 HP Triplex",
      topDrive: "350 HP",
      derrickCapacity: "250 t",
      crewSize: "20-25",
      mobilizationTime: "10-15 Tage",
      dayRate: "32000",
      description: "Kompakte Bohranlage für begrenzte Platzverhältnisse",
      applications: [
        "Flache Bohrungen",
        "Platzbeschränkte Standorte",
        "Workover",
      ],
      technicalSpecs: "Schnelle Mobilisierung, minimaler Footprint",
    },
    {
      id: 5,
      name: "T207",
      category: "Kompakt",
      maxDepth: 2800,
      maxHookLoad: 207,
      footprint: "Klein",
      rotaryTorque: 25000,
      pumpPressure: 4200,
      drawworks: "700 HP",
      mudPumps: "1x 900 HP Triplex",
      topDrive: "300 HP",
      derrickCapacity: "230 t",
      crewSize: "18-22",
      mobilizationTime: "8-12 Tage",
      dayRate: "28000",
      description: "Platzsparende Lösung für flache bis mittlere Bohrungen",
      applications: ["Flache Bohrungen", "Enge Standorte", "Wartungsarbeiten"],
      technicalSpecs: "Containerbasiert, schneller Auf-/Abbau",
    },
  ];

  // Equipment Katalog mit Kategorien
  const equipmentCategories = {
    drillPipe: {
      name: "Bohrgestänge & Drill String",
      icon: Wrench,
      items: [
        {
          id: "dp1",
          name: '5" Bohrgestänge (Drill Pipe)',
          spec: "API 5DP S-135, 19.5 lb/ft",
          connection: "NC50",
          quantity: "300 Stangen",
          price: "450",
        },
        {
          id: "dp2",
          name: '5½" Bohrgestänge',
          spec: "API 5DP G-105, 21.9 lb/ft",
          connection: "NC56",
          quantity: "250 Stangen",
          price: "520",
        },
        {
          id: "hwdp1",
          name: '5" Schwerstangen (HWDP)',
          spec: "API 7-1 S-135, 49.3 lb/ft",
          connection: "NC50",
          quantity: "30 Stangen",
          price: "850",
        },
        {
          id: "dc1",
          name: '8" Drill Collars',
          spec: '2 13/16" ID',
          weight: "234 lb/ft",
          quantity: "20 Stück",
          price: "1200",
        },
      ],
    },
    tanks: {
      name: "Tanks & Silos",
      icon: Droplets,
      items: [
        {
          id: "tank1",
          name: "Spülungstank 500 bbl",
          capacity: "79.5 m³",
          type: "Aktiv-Tank",
          agitator: "2x 50 HP",
          price: "1800",
        },
        {
          id: "tank2",
          name: "Frischwassertank 300 bbl",
          capacity: "47.7 m³",
          material: "Edelstahl",
          price: "1200",
        },
        {
          id: "silo1",
          name: "Barite Silo",
          capacity: "150 m³",
          system: "Pneumatisch",
          price: "2500",
        },
        {
          id: "silo2",
          name: "Bentonit Silo",
          capacity: "100 m³",
          system: "Druckluft",
          price: "2200",
        },
      ],
    },
    power: {
      name: "Stromversorgung",
      icon: Zap,
      items: [
        {
          id: "pow1",
          name: "Netzcontainer 1000 kVA",
          voltage: "690V/400V",
          protection: "IP54",
          price: "4500",
        },
        {
          id: "gen1",
          name: "Generator 500 kW",
          fuel: "1000L Tank",
          runtime: "24h",
          price: "5500",
        },
        {
          id: "gen2",
          name: "Generator 800 kW",
          fuel: "1500L Tank",
          runtime: "20h",
          price: "7800",
        },
      ],
    },
    camps: {
      name: "Unterkünfte & Büros",
      icon: Users,
      items: [
        {
          id: "camp1",
          name: "Wohncontainer 20ft",
          capacity: "4 Personen",
          features: "4 Einzelzimmer",
          price: "850",
        },
        {
          id: "camp2",
          name: "Wohncontainer 40ft Komfort",
          capacity: "8 Personen",
          features: "Klima, TV",
          price: "1600",
        },
        {
          id: "camp3",
          name: "Bürocontainer 20ft",
          capacity: "6 Arbeitsplätze",
          price: "750",
        },
        {
          id: "camp4",
          name: "Sanitärcontainer",
          capacity: "4 Duschen, 4 WCs",
          water: "200L Boiler",
          price: "1200",
        },
        {
          id: "camp5",
          name: "Küchen-Container 40ft",
          capacity: "30 Personen",
          features: "Vollküche",
          price: "2200",
        },
      ],
    },
    safety: {
      name: "Sicherheit & Gas-Detektion",
      icon: Shield,
      items: [
        {
          id: "gas1",
          name: "Festgas-Warnsystem",
          sensors: "12 Sensoren (H2S, CO, CH4, O2)",
          certification: "ATEX Zone 1",
          price: "8500",
        },
        {
          id: "gas2",
          name: "Tragbare Gaswarngeräte",
          quantity: "10 Stück",
          type: "4-Gas Detektor",
          price: "450",
        },
        {
          id: "misc7",
          name: "Feuerlöscher Set",
          quantity: "20x 12kg",
          type: "ABC Pulver",
          price: "1200",
        },
        {
          id: "misc8",
          name: "Erste-Hilfe Container",
          capacity: "50 Personen",
          features: "AED",
          price: "4500",
        },
      ],
    },
    mud: {
      name: "Spülungssysteme",
      icon: Settings,
      items: [
        {
          id: "mud1",
          name: "Mud Mixing System",
          capacity: "100 bbl/h",
          pumps: "2x 150 HP",
          price: "18500",
        },
        {
          id: "mud2",
          name: "Shale Shaker Doppeldeck",
          capacity: "1200 GPM",
          screens: "4 Siebe",
          price: "15000",
        },
        {
          id: "mud3",
          name: "Desander",
          capacity: "800 GPM",
          cones: '12x 10"',
          price: "8500",
        },
        {
          id: "mud5",
          name: "Mud Cleaner",
          capacity: "1000 GPM",
          efficiency: "15-75 Mikron",
          price: "22000",
        },
        {
          id: "mud6",
          name: "Zentrifuge",
          capacity: "400 GPM",
          gForce: "3000G",
          price: "35000",
        },
      ],
    },
    bop: {
      name: "BOP & Well Control",
      icon: AlertCircle,
      items: [
        {
          id: "bop1",
          name: "BOP Stack 10.000 psi",
          size: '13 5/8"',
          config: "Doppel-Ram + Annular",
          price: "125000",
        },
        {
          id: "bop2",
          name: "BOP Stack 5.000 psi",
          size: '13 5/8"',
          config: "Single-Ram + Annular",
          price: "75000",
        },
        {
          id: "bop3",
          name: "BOP Kontrollsystem",
          pressure: "3.000 psi",
          features: "Redundante Pumpen",
          price: "28000",
        },
        {
          id: "bop4",
          name: "Choke Manifold 10K",
          valves: "6x Needle Ventile",
          price: "22000",
        },
      ],
    },
    cranes: {
      name: "Krane & Hebetechnik",
      icon: Truck,
      items: [
        {
          id: "crane1",
          name: "Mobilkran 50t",
          boom: "36m + 12m Wippspitze",
          operator: "Inkl. Bediener",
          price: "2800",
        },
        {
          id: "crane2",
          name: "Raupenkran 100t",
          boom: "48m + 24m Wippspitze",
          operator: "Inkl. Bediener",
          price: "4500",
        },
        {
          id: "crane3",
          name: "Truck Crane 25t",
          boom: "28m Teleskop",
          operator: "Inkl. Bediener",
          price: "1800",
        },
        {
          id: "crane4",
          name: "Gabelstapler 5t",
          lift: "4.5m",
          type: "Diesel Allrad",
          price: "450",
        },
      ],
    },
    misc: {
      name: "Sonstiges",
      icon: Package,
      items: [
        {
          id: "misc1",
          name: "Beleuchtungsturm 4x1000W",
          height: "9m",
          power: "5 kVA Generator",
          price: "320",
        },
        {
          id: "misc2",
          name: "Werkstatt-Container 40ft",
          equipment: "Drehbank, Schweißgerät",
          price: "3500",
        },
        {
          id: "misc3",
          name: "Lager-Container 20ft",
          features: "Regalsystem",
          price: "450",
        },
        {
          id: "misc5",
          name: "Kompressor 10 bar",
          flow: "20 m³/min",
          drive: "Diesel",
          price: "1800",
        },
      ],
    },
  };

  // Rig Matching Logic
  const matchedRigs = useMemo(() => {
    const depth = parseFloat(requirements.depth) || 0;
    const hookLoad = parseFloat(requirements.hookLoad) || 0;
    const torque = parseFloat(requirements.rotaryTorque) || 0;
    const pressure = parseFloat(requirements.pumpPressure) || 0;

    if (depth === 0 && hookLoad === 0 && torque === 0 && pressure === 0) {
      return [];
    }

    return rigs
      .map((rig) => {
        let score = 0;
        const warnings: string[] = [];

        if (depth > 0) {
          if (rig.maxDepth >= depth) score += 25;
          else warnings.push(`Tiefe überschreitet Maximum (${rig.maxDepth}m)`);
        }

        if (hookLoad > 0) {
          if (rig.maxHookLoad >= hookLoad) score += 25;
          else warnings.push(`Hakenlast zu hoch (Max: ${rig.maxHookLoad}t)`);
        }

        if (torque > 0) {
          if (rig.rotaryTorque >= torque) score += 25;
          else warnings.push("Drehmoment unzureichend");
        }

        if (pressure > 0) {
          if (rig.pumpPressure >= pressure) score += 25;
          else warnings.push("Pumpendruck zu niedrig");
        }

        if (
          requirements.footprint &&
          rig.footprint !== requirements.footprint
        ) {
          score -= 10;
        }

        return {
          ...rig,
          score,
          warnings,
          isSuitable: warnings.length === 0 && score > 0,
        };
      })
      .filter((rig) => rig.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [requirements, rigs]);

  // Equipment Toggle
  const toggleEquipment = (category: string, item: EquipmentItem) => {
    setSelectedEquipment((prev) => {
      const current = prev[category] || [];
      const exists = current.find((i) => i.id === item.id);

      if (exists) {
        return { ...prev, [category]: current.filter((i) => i.id !== item.id) };
      } else {
        return { ...prev, [category]: [...current, item] };
      }
    });
  };

  // Calculate Total Cost
  const calculateTotal = () => {
    let total = 0;
    if (selectedRig) {
      total += parseFloat(selectedRig.dayRate);
    }
    Object.values(selectedEquipment).forEach((items) => {
      items.forEach((item) => {
        total += parseFloat(item.price);
      });
    });
    return total;
  };

  // Generate PDF Export
  const exportConfiguration = () => {
    if (!selectedRig) {
      toast({
        title: "Keine Anlage ausgewählt",
        description: "Bitte wählen Sie zuerst eine Bohranlage aus.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Konfiguration wird exportiert",
      description: "PDF-Export wird generiert...",
    });

    // TODO: Implement actual PDF generation
    console.log("Export Configuration:", {
      requirements,
      selectedRig,
      selectedEquipment,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Building2 className="h-8 w-8" />
                Bohranlagen Konfigurator
              </h1>
              <p className="text-blue-100">
                Professionelle Anlagenkonfiguration für Commerce
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-200">Gesamtpreis (Tagesrate)</p>
              <p className="text-3xl font-bold">
                € {calculateTotal().toLocaleString("de-DE")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="requirements" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger
              value="requirements"
              className="flex flex-col gap-1 py-3"
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs">Anforderungen</span>
            </TabsTrigger>
            <TabsTrigger
              value="rigs"
              className="flex flex-col gap-1 py-3"
              disabled={matchedRigs.length === 0}
            >
              <Building2 className="h-5 w-5" />
              <span className="text-xs">Anlagen ({matchedRigs.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="equipment"
              className="flex flex-col gap-1 py-3"
              disabled={!selectedRig}
            >
              <Package className="h-5 w-5" />
              <span className="text-xs">Equipment</span>
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="flex flex-col gap-1 py-3"
              disabled={!selectedRig}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs">Zusammenfassung</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Requirements */}
          <TabsContent value="requirements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Projekt-Anforderungen</CardTitle>
                <CardDescription>
                  Geben Sie die Projekt-Details und Bohr-Parameter ein
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Project Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Projektname *</Label>
                    <Input
                      id="projectName"
                      value={requirements.projectName}
                      onChange={(e) =>
                        setRequirements({
                          ...requirements,
                          projectName: e.target.value,
                        })
                      }
                      placeholder="z.B. North Sea Project"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Kunde *</Label>
                    <Input
                      id="clientName"
                      value={requirements.clientName}
                      onChange={(e) =>
                        setRequirements({
                          ...requirements,
                          clientName: e.target.value,
                        })
                      }
                      placeholder="Kundenname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Standort *</Label>
                    <Input
                      id="location"
                      value={requirements.location}
                      onChange={(e) =>
                        setRequirements({
                          ...requirements,
                          location: e.target.value,
                        })
                      }
                      placeholder="Bohrstandort"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Projektdauer</Label>
                    <Input
                      id="duration"
                      value={requirements.projectDuration}
                      onChange={(e) =>
                        setRequirements({
                          ...requirements,
                          projectDuration: e.target.value,
                        })
                      }
                      placeholder="z.B. 90 Tage"
                    />
                  </div>
                </div>

                <Separator />

                {/* Technical Parameters */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Technische Parameter
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="depth">Bohrtiefe (m) *</Label>
                      <Input
                        id="depth"
                        type="number"
                        value={requirements.depth}
                        onChange={(e) =>
                          setRequirements({
                            ...requirements,
                            depth: e.target.value,
                          })
                        }
                        placeholder="5000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hookLoad">Hakenlast (t) *</Label>
                      <Input
                        id="hookLoad"
                        type="number"
                        value={requirements.hookLoad}
                        onChange={(e) =>
                          setRequirements({
                            ...requirements,
                            hookLoad: e.target.value,
                          })
                        }
                        placeholder="400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footprint">Platzbedarf</Label>
                      <Select
                        value={requirements.footprint}
                        onValueChange={(value) =>
                          setRequirements({
                            ...requirements,
                            footprint: value as
                              | ""
                              | "Klein"
                              | "Mittel"
                              | "Groß",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Klein">Klein</SelectItem>
                          <SelectItem value="Mittel">Mittel</SelectItem>
                          <SelectItem value="Groß">Groß</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="torque">Rotary-Drehmoment (Nm)</Label>
                      <Input
                        id="torque"
                        type="number"
                        value={requirements.rotaryTorque}
                        onChange={(e) =>
                          setRequirements({
                            ...requirements,
                            rotaryTorque: e.target.value,
                          })
                        }
                        placeholder="50000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pressure">Pumpendruck (psi)</Label>
                      <Input
                        id="pressure"
                        type="number"
                        value={requirements.pumpPressure}
                        onChange={(e) =>
                          setRequirements({
                            ...requirements,
                            pumpPressure: e.target.value,
                          })
                        }
                        placeholder="5000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mudWeight">Spülungsgewicht (ppg)</Label>
                      <Input
                        id="mudWeight"
                        type="number"
                        step="0.1"
                        value={requirements.mudWeight}
                        onChange={(e) =>
                          setRequirements({
                            ...requirements,
                            mudWeight: e.target.value,
                          })
                        }
                        placeholder="12.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="casingSize">Casing Größe (")</Label>
                      <Input
                        id="casingSize"
                        value={requirements.casingSize}
                        onChange={(e) =>
                          setRequirements({
                            ...requirements,
                            casingSize: e.target.value,
                          })
                        }
                        placeholder='13 3/8"'
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="holeSize">Bohrloch Größe (")</Label>
                      <Input
                        id="holeSize"
                        value={requirements.holeSize}
                        onChange={(e) =>
                          setRequirements({
                            ...requirements,
                            holeSize: e.target.value,
                          })
                        }
                        placeholder='17 1/2"'
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="formPressure">
                        Formationsdruck (psi)
                      </Label>
                      <Input
                        id="formPressure"
                        type="number"
                        value={requirements.formationPressure}
                        onChange={(e) =>
                          setRequirements({
                            ...requirements,
                            formationPressure: e.target.value,
                          })
                        }
                        placeholder="8000"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Zusätzliche Anforderungen</Label>
                  <Textarea
                    id="notes"
                    value={requirements.additionalNotes}
                    onChange={(e) =>
                      setRequirements({
                        ...requirements,
                        additionalNotes: e.target.value,
                      })
                    }
                    placeholder="Spezielle Anforderungen, Besonderheiten..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    size="lg"
                    className="flex-1"
                    disabled={!requirements.depth && !requirements.hookLoad}
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Passende Anlagen finden ({matchedRigs.length})
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      setRequirements({
                        projectName: "",
                        clientName: "",
                        location: "",
                        projectDuration: "",
                        depth: "",
                        hookLoad: "",
                        footprint: "",
                        rotaryTorque: "",
                        pumpPressure: "",
                        mudWeight: "",
                        casingSize: "",
                        holeSize: "",
                        formationPressure: "",
                        additionalNotes: "",
                      });
                      setSelectedRig(null);
                    }}
                  >
                    Zurücksetzen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Rigs */}
          <TabsContent value="rigs" className="space-y-4">
            {matchedRigs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold">
                    Keine Anlagen gefunden
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Passen Sie die Anforderungen an
                  </p>
                </CardContent>
              </Card>
            ) : (
              matchedRigs.map((rig, index) => (
                <Card
                  key={rig.id}
                  className={`cursor-pointer transition-all ${
                    selectedRig?.id === rig.id
                      ? "ring-2 ring-blue-500 shadow-lg"
                      : "hover:shadow-md"
                  } ${
                    rig.isSuitable && index === 0
                      ? "border-2 border-green-500"
                      : ""
                  }`}
                  onClick={() => setSelectedRig(rig)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-2xl">{rig.name}</CardTitle>
                          <Badge variant="secondary">{rig.category}</Badge>
                          {rig.isSuitable && index === 0 && (
                            <Badge className="bg-green-500">EMPFEHLUNG</Badge>
                          )}
                          {selectedRig?.id === rig.id && (
                            <Badge className="bg-blue-500">AUSGEWÄHLT</Badge>
                          )}
                        </div>
                        <CardDescription className="text-base">
                          {rig.description}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Tagesrate
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          € {parseFloat(rig.dayRate).toLocaleString("de-DE")}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground font-semibold mb-1">
                          MAX. TIEFE
                        </p>
                        <p className="text-lg font-bold">
                          {rig.maxDepth.toLocaleString()} m
                        </p>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground font-semibold mb-1">
                          HAKENLAST
                        </p>
                        <p className="text-lg font-bold">{rig.maxHookLoad} t</p>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground font-semibold mb-1">
                          DREHMOMENT
                        </p>
                        <p className="text-lg font-bold">
                          {rig.rotaryTorque.toLocaleString()} Nm
                        </p>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground font-semibold mb-1">
                          PUMPENDRUCK
                        </p>
                        <p className="text-lg font-bold">
                          {rig.pumpPressure.toLocaleString()} psi
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Drawworks</p>
                        <p className="font-semibold">{rig.drawworks}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mud Pumps</p>
                        <p className="font-semibold">{rig.mudPumps}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Top Drive</p>
                        <p className="font-semibold">{rig.topDrive}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Crew Size</p>
                        <p className="font-semibold">{rig.crewSize}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mobilisierung</p>
                        <p className="font-semibold">{rig.mobilizationTime}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Platzbedarf</p>
                        <p className="font-semibold">{rig.footprint}</p>
                      </div>
                    </div>

                    {rig.warnings && rig.warnings.length > 0 && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm font-semibold text-amber-800 mb-1">
                          ⚠️ Hinweise:
                        </p>
                        <ul className="text-sm text-amber-700 list-disc list-inside">
                          {rig.warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      {rig.applications.map((app) => (
                        <Badge key={app} variant="outline">
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Tab 3: Equipment */}
          <TabsContent value="equipment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Zusatzausrüstung wählen</CardTitle>
                <CardDescription>
                  Wählen Sie die benötigte Zusatzausrüstung für Ihr Projekt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-6">
                    {Object.entries(equipmentCategories).map(
                      ([key, category]) => {
                        const Icon = category.icon;
                        const selected = selectedEquipment[key] || [];

                        return (
                          <div key={key}>
                            <div className="flex items-center gap-2 mb-3">
                              <Icon className="h-5 w-5 text-blue-600" />
                              <h3 className="text-lg font-semibold">
                                {category.name}
                              </h3>
                              {selected.length > 0 && (
                                <Badge variant="secondary">
                                  {selected.length} ausgewählt
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-2">
                              {category.items.map((item) => {
                                const isSelected = selected.some(
                                  (s) => s.id === item.id
                                );
                                return (
                                  <div
                                    key={item.id}
                                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                                      isSelected
                                        ? "bg-blue-50 border-blue-300"
                                        : "hover:bg-muted/50"
                                    }`}
                                    onClick={() => toggleEquipment(key, item)}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      className="mt-1"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-sm">
                                        {item.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {Object.entries(item)
                                          .filter(
                                            ([key]) =>
                                              key !== "id" &&
                                              key !== "name" &&
                                              key !== "price"
                                          )
                                          .map(([, value]) => value)
                                          .join(" • ")}
                                      </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className="font-bold text-green-600">
                                        €{" "}
                                        {parseFloat(item.price).toLocaleString(
                                          "de-DE"
                                        )}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        /Tag
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <Separator className="mt-4" />
                          </div>
                        );
                      }
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Summary */}
          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Konfigurations-Zusammenfassung</CardTitle>
                    <CardDescription>
                      Überprüfen Sie Ihre Auswahl und exportieren Sie die
                      Konfiguration
                    </CardDescription>
                  </div>
                  <Button onClick={exportConfiguration}>
                    <Download className="mr-2 h-4 w-4" />
                    PDF Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Project Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Projekt-Informationen
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Projektname</p>
                      <p className="font-semibold">
                        {requirements.projectName || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Kunde</p>
                      <p className="font-semibold">
                        {requirements.clientName || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Standort</p>
                      <p className="font-semibold">
                        {requirements.location || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Dauer</p>
                      <p className="font-semibold">
                        {requirements.projectDuration || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Selected Rig */}
                {selectedRig && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Ausgewählte Anlage
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xl font-bold">{selectedRig.name}</p>
                        <p className="text-xl font-bold text-green-600">
                          €{" "}
                          {parseFloat(selectedRig.dayRate).toLocaleString(
                            "de-DE"
                          )}
                          /Tag
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {selectedRig.description}
                      </p>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Max. Tiefe</p>
                          <p className="font-semibold">
                            {selectedRig.maxDepth}m
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Hakenlast</p>
                          <p className="font-semibold">
                            {selectedRig.maxHookLoad}t
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Crew</p>
                          <p className="font-semibold">
                            {selectedRig.crewSize}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Mobilisierung</p>
                          <p className="font-semibold">
                            {selectedRig.mobilizationTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Selected Equipment */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Ausgewählte Zusatzausrüstung
                  </h3>
                  {Object.entries(selectedEquipment).filter(
                    ([, items]) => items.length > 0
                  ).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Keine Zusatzausrüstung ausgewählt
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(selectedEquipment)
                        .filter(([, items]) => items.length > 0)
                        .map(([key, items]) => {
                          const category =
                            equipmentCategories[
                              key as keyof typeof equipmentCategories
                            ];
                          return (
                            <div key={key}>
                              <p className="font-semibold text-sm mb-2">
                                {category.name}
                              </p>
                              <div className="space-y-1">
                                {items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded"
                                  >
                                    <span>{item.name}</span>
                                    <span className="font-semibold text-green-600">
                                      €{" "}
                                      {parseFloat(item.price).toLocaleString(
                                        "de-DE"
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Cost Summary */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Kosten-Übersicht (Tagesraten)
                  </h3>
                  <div className="space-y-2 text-sm mb-4">
                    {selectedRig && (
                      <div className="flex justify-between">
                        <span>Bohranlage {selectedRig.name}</span>
                        <span className="font-semibold">
                          €{" "}
                          {parseFloat(selectedRig.dayRate).toLocaleString(
                            "de-DE"
                          )}
                        </span>
                      </div>
                    )}
                    {Object.values(selectedEquipment).flat().length > 0 && (
                      <div className="flex justify-between">
                        <span>
                          Zusatzausrüstung (
                          {Object.values(selectedEquipment).flat().length}{" "}
                          Positionen)
                        </span>
                        <span className="font-semibold">
                          €{" "}
                          {Object.values(selectedEquipment)
                            .flat()
                            .reduce(
                              (sum, item) => sum + parseFloat(item.price),
                              0
                            )
                            .toLocaleString("de-DE")}
                        </span>
                      </div>
                    )}
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">Gesamt Tagesrate</span>
                    <span className="text-3xl font-bold text-green-700">
                      € {calculateTotal().toLocaleString("de-DE")}
                    </span>
                  </div>
                  {requirements.projectDuration && (
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">
                          Projektkosten ({requirements.projectDuration})
                        </span>
                        <span className="text-xl font-bold text-green-800">
                          €{" "}
                          {(
                            calculateTotal() *
                            parseInt(
                              requirements.projectDuration.replace(/\D/g, "") ||
                                "0"
                            )
                          ).toLocaleString("de-DE")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RigConfigurator;
