"use client";

import { useState } from "react";
import { useMemo } from "react";
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
import { DERIVED_HINTS, emptyFieldState, recompute, type FieldState } from "@/lib/derivation";

const SHIFTS = ["Morning", "Evening", "Night"] as const;
const GRID_GROUP_ID = "grid";

function todayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function NumberField({
  id,
  label,
  unit,
  value,
  hint,
  onChange,
}: {
  id: string;
  label: string;
  unit?: string;
  value: string;
  hint?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {unit ? <span className="text-muted-foreground"> ({unit})</span> : null}
      </Label>
      <Input id={id} inputMode="decimal" placeholder="0" value={value} onChange={(e) => onChange(e.target.value)} />
      {hint ? <p className="text-muted-foreground text-xs">{hint}, editable</p> : null}
    </div>
  );
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
  const [fieldState, setFieldState] = useState<FieldState>(() => emptyFieldState());
  const [isGenerating, setIsGenerating] = useState(false);

  const updateHeader = <K extends keyof HeaderInfo>(key: K, val: HeaderInfo[K]) =>
    setHeader((prev) => ({ ...prev, [key]: val }));

  const setFieldValue = (mp: string, val: string) => {
    setFieldState((prev) => recompute({ ...prev.values, [mp]: val }, prev.lastAuto, powerFactor));
  };

  const updatePowerFactor = (val: string) => {
    setPowerFactor(val);
    setFieldState((prev) => recompute(prev.values, prev.lastAuto, val));
  };

  async function handleDownload() {
    setIsGenerating(true);
    try {
      const blob = await generateShiftLogWorkbook(header, fieldState.values);
      const dateForFile = header.date || "date";
      const filename = `${header.stationName.replace(/\s+/g, "_")}_${dateForFile}_${header.shift}.xlsx`;
      downloadBlob(blob, filename);
    } finally {
      setIsGenerating(false);
    }
  }

  const gridGroup = EQUIPMENT_GROUPS.find((g) => g.id === GRID_GROUP_ID)!;
  const otherGroups = EQUIPMENT_GROUPS.filter((g) => g.id !== GRID_GROUP_ID);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{header.stationName} Shift Log</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Fill in the shift details and readings below, then download the formatted Excel sheet. Fields marked with
          a hint are pre-filled automatically but can be overridden at any time.
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
              placeholder="e.g. Anwar Shah"
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
            <Input id="date" type="date" value={header.date} onChange={(e) => updateHeader("date", e.target.value)} />
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
          <CardDescription>Entered once here and pre-filled into every POWER FACTOR field below.</CardDescription>
        </CardHeader>
        <CardContent className="max-w-xs">
          <NumberField id="powerFactor" label="Power Factor" value={powerFactor} onChange={updatePowerFactor} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{gridGroup.title}</CardTitle>
          <CardDescription>
            The 220kV and 132kV Bus Bar 1 readings are pre-filled into every feeder&apos;s VOLTAGE KV field below.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gridGroup.rows.map((row) => (
            <NumberField
              key={row.mp}
              id={row.mp}
              label={row.mpDescription === "VOLTAGE KV" ? `${row.equipment} Voltage` : row.mpDescription}
              unit={row.unit}
              value={fieldState.values[row.mp] ?? ""}
              hint={DERIVED_HINTS[row.mp]}
              onChange={(v) => setFieldValue(row.mp, v)}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Readings</CardTitle>
          <CardDescription>Every measuring point, grouped by equipment.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {otherGroups.map((group) => (
              <AccordionItem key={group.id} value={group.id}>
                <AccordionTrigger className="text-sm font-medium">{group.title}</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 gap-4 pb-2 sm:grid-cols-2 lg:grid-cols-3">
                    {group.rows.map((row) => (
                      <NumberField
                        key={row.mp}
                        id={row.mp}
                        label={row.mpDescription}
                        unit={row.unit}
                        value={fieldState.values[row.mp] ?? ""}
                        hint={DERIVED_HINTS[row.mp]}
                        onChange={(v) => setFieldValue(row.mp, v)}
                      />
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
              with their template default values.
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
