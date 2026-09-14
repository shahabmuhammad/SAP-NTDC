"use client";

import { useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { EQUIPMENT_GROUPS, STATUS_ROWS } from "@/lib/sap-data";
import { downloadBlob, generateShiftLogWorkbook, type HeaderInfo } from "@/lib/generate-excel";
import { halfHourTimeOptions } from "@/lib/time-options";

const SHIFTS = ["Morning", "Evening", "Night"] as const;

function todayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function ShiftLogForm() {
  const timeOptions = useMemo(() => halfHourTimeOptions(), []);

  const [header, setHeader] = useState<HeaderInfo>({
    stationName: "220kV Mardan",
    date: todayIsoDate(),
    shift: "Morning",
    time: "08:30",
    employeeName: "",
    employeeId: "",
    version: "2.0",
  });

  const [powerFactor, setPowerFactor] = useState("0.99");
  const [values, setValues] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const setValue = (key: string, val: string) => setValues((prev) => ({ ...prev, [key]: val }));

  const updateHeader = <K extends keyof HeaderInfo>(key: K, val: HeaderInfo[K]) =>
    setHeader((prev) => ({ ...prev, [key]: val }));

  async function handleDownload() {
    setIsGenerating(true);
    try {
      const blob = await generateShiftLogWorkbook(header, { ...values, powerFactor });
      const dateForFile = header.date || "date";
      const filename = `${header.stationName.replace(/\s+/g, "_")}_${dateForFile}_${header.shift}.xlsx`;
      downloadBlob(blob, filename);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{header.stationName} Shift Log</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Fill in the shift details and readings below, then download the formatted Excel sheet.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shift Details</CardTitle>
          <CardDescription>Applied to the header block and repeated on every exported row.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stationName">Station Name</Label>
            <Input
              id="stationName"
              value={header.stationName}
              onChange={(e) => updateHeader("stationName", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="employeeName">Employee Name</Label>
            <Input
              id="employeeName"
              placeholder="e.g. Muhammad Taimoor Yousaf"
              value={header.employeeName}
              onChange={(e) => updateHeader("employeeName", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="employeeId">Employee No.</Label>
            <Input
              id="employeeId"
              placeholder="e.g. 11499"
              value={header.employeeId}
              onChange={(e) => updateHeader("employeeId", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={header.date}
              onChange={(e) => updateHeader("date", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="time">Time</Label>
            <Select value={header.time} onValueChange={(v) => updateHeader("time", v)}>
              <SelectTrigger id="time" className="w-full">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {timeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="shift">Shift</Label>
            <Select value={header.shift} onValueChange={(v) => updateHeader("shift", v as HeaderInfo["shift"])}>
              <SelectTrigger id="shift" className="w-full">
                <SelectValue placeholder="Select shift" />
              </SelectTrigger>
              <SelectContent>
                {SHIFTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="version">Version</Label>
            <Input id="version" value={header.version} onChange={(e) => updateHeader("version", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Power Factor</CardTitle>
          <CardDescription>Entered once here and applied to every POWER FACTOR row in the sheet.</CardDescription>
        </CardHeader>
        <CardContent className="max-w-xs">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="powerFactor">Power Factor</Label>
            <Input
              id="powerFactor"
              inputMode="decimal"
              value={powerFactor}
              onChange={(e) => setPowerFactor(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Readings</CardTitle>
          <CardDescription>Enter the value for each measuring point, grouped by equipment.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {EQUIPMENT_GROUPS.map((group) => (
              <AccordionItem key={group.id} value={group.id}>
                <AccordionTrigger className="text-sm font-medium">{group.title}</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 gap-4 pb-2 sm:grid-cols-2 lg:grid-cols-3">
                    {group.rows
                      .filter((row) => row.editable)
                      .map((row) => (
                        <div key={row.fieldKey} className="flex flex-col gap-1.5">
                          <Label htmlFor={row.fieldKey}>
                            {row.mpDescription}
                            {row.unit ? <span className="text-muted-foreground"> ({row.unit})</span> : null}
                          </Label>
                          <Input
                            id={row.fieldKey}
                            inputMode="decimal"
                            placeholder="0"
                            value={values[row.fieldKey!] ?? ""}
                            onChange={(e) => setValue(row.fieldKey!, e.target.value)}
                          />
                        </div>
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm">Breaker &amp; Switch Status Rows</CardTitle>
            <CardDescription>
              {STATUS_ROWS.length} circuit breaker / disconnector / earth-switch rows are included in the export
              with their template default values. Editable inputs for these will be added once the repeated
              points are confirmed.
            </CardDescription>
          </div>
          <Badge variant="secondary">{STATUS_ROWS.length} rows</Badge>
        </CardHeader>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button size="lg" onClick={handleDownload} disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Download Excel Sheet"}
        </Button>
      </div>
    </div>
  );
}
