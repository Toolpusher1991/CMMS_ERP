import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function Reporting() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Reporting
          </h1>
          <p className="text-muted-foreground mt-2">
            Erstelle und verwalte Reports
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report-Erstellung</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Hier können Reports erstellt werden.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
