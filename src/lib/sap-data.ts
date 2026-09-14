// Data model mirroring the "220kV Mardan" SAP shift-log export.
// Column order/typos ("Measuing point Description") are kept verbatim to match the source template.

export interface DataRow {
  equipment: string;
  unit: string;
  mpDescription: string;
  mp: string;
  valuationCode: number;
  /** Fixed value used for rows that are not derived from form input (status rows). */
  fixedValue?: string | number;
}

export interface EquipmentGroup {
  id: string;
  title: string;
  rows: DataRow[];
}

function transformerGroup(equipment: string, mpBase: number): DataRow[] {
  const n = (offset: number) => String(mpBase + offset);
  return [
    { equipment, unit: "A", mpDescription: "HV LOAD (AMP)", mp: n(0), valuationCode: 1 },
    { equipment, unit: "A", mpDescription: "LV LOAD (AMP)", mp: n(1), valuationCode: 1 },
    { equipment, unit: "MW", mpDescription: "REAL POWER FLOW (MW)", mp: n(2), valuationCode: 1 },
    { equipment, unit: "MVAR", mpDescription: "REACTIVE P F (MVAR)", mp: n(3), valuationCode: 1 },
    { equipment, unit: "", mpDescription: "POWER FACTOR", mp: n(4), valuationCode: 1 },
    { equipment, unit: "°C", mpDescription: "OIL TEMP HV", mp: n(5), valuationCode: 1 },
    { equipment, unit: "°C", mpDescription: "OIL TEMP LV", mp: n(6), valuationCode: 1 },
    { equipment, unit: "°C", mpDescription: "WDG TEMP HV", mp: n(7), valuationCode: 1 },
    { equipment, unit: "°C", mpDescription: "WDG TEMP LV", mp: n(8), valuationCode: 1 },
    { equipment, unit: "EA", mpDescription: "TAP POSITION", mp: n(9), valuationCode: 1 },
  ];
}

function feederGroup(equipment: string, mpBase: number, realPowerCode = 1): DataRow[] {
  const n = (offset: number) => String(mpBase + offset);
  return [
    { equipment, unit: "kV", mpDescription: "VOLTAGE KV", mp: n(0), valuationCode: 1 },
    { equipment, unit: "MW", mpDescription: "REAL POWER I/E", mp: n(1), valuationCode: realPowerCode },
    { equipment, unit: "MVAR", mpDescription: "REACTIVE POWER I/E", mp: n(2), valuationCode: 1 },
    { equipment, unit: "", mpDescription: "POWER FACTOR", mp: n(3), valuationCode: 1 },
    { equipment, unit: "A", mpDescription: "LOAD (AMP)", mp: n(4), valuationCode: 1 },
  ];
}

function chargerGroup(equipment: string, mpBase: number): DataRow[] {
  const n = (offset: number) => String(mpBase + offset);
  return [
    { equipment, unit: "V", mpDescription: "DC VOLTAGE (VDC)", mp: n(0), valuationCode: 1 },
    { equipment, unit: "A", mpDescription: "DC CURRENT (A)", mp: n(1), valuationCode: 1 },
  ];
}

export const EQUIPMENT_GROUPS: EquipmentGroup[] = [
  {
    id: "grid",
    title: "220kV Grid Station NGCP Mardan / Bus Bars",
    rows: [
      { equipment: "220kV Grid Station NGCP Mardan", unit: "Hz", mpDescription: "FREQUENCY (HZ)", mp: "23701", valuationCode: 1 },
      { equipment: "220kV Grid Station NGCP Mardan", unit: "°C", mpDescription: "TEMPERATURE/WEATHER", mp: "23702", valuationCode: 21 },
      { equipment: "MRN 220kV Bus Bar 1", unit: "kV", mpDescription: "VOLTAGE KV", mp: "23724", valuationCode: 1 },
      { equipment: "MRN 220kV Bus Bar 2", unit: "kV", mpDescription: "VOLTAGE KV", mp: "23723", valuationCode: 1 },
      { equipment: "MRN 132kV Bus Bar 1", unit: "kV", mpDescription: "VOLTAGE KV", mp: "23806", valuationCode: 1 },
      { equipment: "MRN 132kV Bus Bar 2", unit: "kV", mpDescription: "VOLTAGE KV", mp: "23805", valuationCode: 1 },
    ],
  },
  { id: "t1", title: "MRN 220/132kV 250MVA T-1 (D7Q1/E5Q1)", rows: transformerGroup("MRN 220/132kV 250MVA T-1 D7Q1/E5Q1", 23745) },
  { id: "t2", title: "MRN 220/132kV 250MVA T-2 (D6Q1/E4Q1)", rows: transformerGroup("MRN 220/132kV 250MVA T-2 D6Q1/E4Q1", 23735) },
  { id: "t3", title: "MRN 220/132kV 250MVA T-3 (D8Q1/E6Q1)", rows: transformerGroup("MRN 220/132kV 250MVA T-3 D8Q1/E6Q1", 23725) },
  { id: "trb1", title: "MRN 220kV TRB1 (D1Q1)", rows: feederGroup("MRN 220kV TRB1 D1Q1", 23708, 17) },
  { id: "trb2", title: "MRN 220kV TRB2 (D2Q1)", rows: feederGroup("MRN 220kV TRB2 D2Q1", 23703, 17) },
  { id: "now", title: "MRN 220kV NOW (D4Q1)", rows: feederGroup("MRN 220kV NOW D4Q1", 23713, 17) },
  { id: "ckd", title: "MRN 220kV CKD (D5Q1)", rows: feederGroup("MRN 220kV CKD D5Q1", 23718, 18) },
  { id: "t4", title: "MRN 132/11kV 40MVA T-4 (E12Q1)", rows: transformerGroup("MRN 132/11kV 40MVA T-4 E12Q1", 23817).map((r) => (r.mpDescription === "REAL POWER FLOW (MW)" ? { ...r, valuationCode: 18 } : r)) },
  { id: "t5", title: "MRN 132/11kV 40MVA T-5 (E11Q1)", rows: transformerGroup("MRN 132/11kV 40MVA T-5 E11Q1", 23807) },
  { id: "rez1", title: "MRN 132kV REZ1 (E1Q1)", rows: feederGroup("MRN 132kV REZ1 E1Q1", 23775, 10) },
  { id: "rez2", title: "MRN 132kV REZ2 (E2Q1)", rows: feederGroup("MRN 132kV REZ2 E2Q1", 23770, 10) },
  { id: "rib", title: "MRN 132kV RIB (E7Q1)", rows: feederGroup("MRN 132kV RIB E7Q1", 23765) },
  { id: "zrk", title: "MRN 132kV ZRK (E8Q1)", rows: feederGroup("MRN 132kV ZRK E8Q1", 23755) },
  { id: "shb", title: "MRN 132kV SHB (E9Q1)", rows: feederGroup("MRN 132kV SHB E9Q1", 23760, 10) },
  { id: "mrd2", title: "MRN 132kV MRD2 (E15Q1)", rows: feederGroup("MRN 132kV MRD2 E15Q1", 23785) },
  { id: "mrd3", title: "MRN 132kV MRD3 (E16Q1)", rows: feederGroup("MRN 132kV MRD3 E16Q1", 23780) },
  { id: "jla", title: "MRN 132kV JLA (E17Q1)", rows: feederGroup("MRN 132kV JLA E17Q1", 23795) },
  { id: "jng", title: "MRN 132kV JNG (E18Q1)", rows: feederGroup("MRN 132kV JNG E18Q1", 23790) },
  { id: "drg", title: "MRN 132kV DRG (E19Q1)", rows: feederGroup("MRN 132kV DRG E19Q1", 23800) },
  { id: "chg-a1", title: "220V Battery Charger 40A Set-A", rows: chargerGroup("220V Battery Charger 40A Set-A", 25181) },
  { id: "chg-b1", title: "220V Battery Charger 100A Set-B", rows: chargerGroup("220V Battery Charger 100A Set-B", 25183) },
  { id: "chg-a2", title: "110V Battery Charger 25A Set-A", rows: chargerGroup("110V Battery Charger 25A Set-A", 25185) },
  { id: "chg-b2", title: "110V Battery Charger 40A Set-B", rows: chargerGroup("110V Battery Charger 40A Set-B", 25187) },
];

// Circuit breaker / disconnector / earth-switch status rows.
// Not editable in this version — exported with their fixed template values (1 = closed default, 0 = earth switch open).
const STATUS_ITEMS: [string, number, number][] = [
  ["220kV CB 31kA 2kA SF6 D1Q1 TRB1", 25189, 1],
  ["220kV CB 31kA 2kA SF6 D2Q1 TRB2", 25190, 1],
  ["220kV CB 50kA 4kA SF6 D3Q1 BC", 25191, 1],
  ["220kV CB 50kA 4kA SF6 D4Q1 NOW", 25192, 1],
  ["220kV CB 50kA 4kA SF6 D5Q1 CKD", 25193, 1],
  ["220kV CB 50kA 4kA SF6 D6Q1 T2", 25194, 1],
  ["220kV CB 50kA 4kA SF6 D7Q1 T1", 25195, 1],
  ["220kV CB 50kA 4kA SF6 D8Q1 T3", 25196, 1],
  ["132kV CB 40kA 4kA SF6 E1Q1", 25197, 1],
  ["132kV CB 40kA 4kA SF6 E2Q1", 25198, 1],
  ["132kV CB 40kA 4kA SF6 E3Q1", 25199, 1],
  ["132kV CB 40kA 4kA SF6 E4Q1", 25200, 1],
  ["132kV CB 40kA 4kA SF6 E5Q1", 25201, 1],
  ["132kV CB 40kA 4kA SF6 E6Q1", 25202, 1],
  ["132kV CB 40kA 4kA SF6 E7Q1", 25203, 1],
  ["132kV CB 40kA 4kA SF6 E8Q1", 25204, 1],
  ["132kV CB 40kA 4kA SF6 E9Q1", 25205, 1],
  ["132kV CB 40kA 4kA SF6 E10Q1", 25206, 1],
  ["132kV CB 40kA 4kA SF6 E11Q1", 25207, 1],
  ["132kV CB 40kA 4kA SF6 E12Q1", 25208, 1],
  ["132kV CB 40kA 4kA SF6 E13Q1", 25209, 1],
  ["132kV CB 40kA 4kA SF6 E14Q1 CBK", 25210, 1],
  ["132kV CB 40kA 2kA SF6 E15Q1 MRD2", 25211, 1],
  ["132kV CB 40kA 4kA SF6 E16Q1", 25212, 1],
  ["132kV CB 40kA 2kA SF6 E17Q1 JLA", 25213, 1],
  ["132kV CB 40kA 2kA SF6 E18Q1 JNG", 25214, 1],
  ["132kV CB 40kA 4kA SF6 E19Q1", 25215, 1],
  ["220kV DS 30kA 1kA D1Q11 BB1 Srs", 25216, 1],
  ["220kV DS 30kA 1kA D1Q12 BB2 Srs", 25217, 1],
  ["220kV DS 30kA 1kA D1Q10 TRB1 Srs", 25218, 1],
  ["220kV DS 30kA 1kA D2Q11 BB1 Srs", 25219, 1],
  ["220kV DS 30kA 1kA D2Q12 BB2 Srs", 25220, 1],
  ["220kV DS 30kA 1kA D2Q10 TRB2 Srs", 25221, 1],
  ["220kV DS 30kA 1kA D3Q11 BB1 Srs", 25222, 1],
  ["220kV DS 30kA 1kA D3Q12 BB2 Srs", 25223, 1],
  ["220kV DS 30kA 1kA D4Q11 BB1 Srs", 25224, 1],
  ["220kV DS 30kA 1kA D4Q12 BB2 Srs", 25225, 1],
  ["220kV DS 30kA 1kA D4Q10 NOW Srs", 25226, 1],
  ["220kV DS 30kA 1kA D5Q11 BB1 Srs", 25227, 1],
  ["220kV DS 30kA 1kA D5Q12 BB2 Srs", 25228, 1],
  ["220kV DS 30kA 1kA D5Q10 CKD Srs", 25229, 1],
  ["220kV DS 50kA 2kA D6Q11 BB1 Srs", 25230, 1],
  ["220kV DS 50kA 2kA D6Q12 BB2 Srs", 25231, 1],
  ["220kV DS 50kA 2kA D7Q11 BB1 Srs", 25232, 1],
  ["220kV DS 50kA 2kA D7Q12 BB2 Srs", 25233, 1],
  ["220kV DS 50kA 2kA D8Q11 BB1 Srs", 25234, 1],
  ["220kV DS 50kA 2kA D8Q12 BB2 Srs", 25235, 1],
  ["220kV DS 30kA 1kA PT1 BB1 Srs", 25236, 1],
  ["220kV DS 30kA 1kA PT2 BB2 Srs", 25237, 1],
  ["132kV DS 40kA 2kA E1Q11 BB1 Srs", 25238, 1],
  ["132kV DS 40kA 2kA E1Q12 BB2 Srs", 25239, 1],
  ["132kV DS 40kA 2kA 101 REZ1 Srs", 25240, 1],
  ["132kV DS 40kA 2kA E2Q11 BB1 Srs", 25241, 1],
  ["132kV DS 40kA 2kA E2Q12 BB2 Srs", 25242, 1],
  ["132kV DS 40kA 2kA 102 REZ2 Srs", 25243, 1],
  ["132kV DS 50kA 1kA E3Q11 BB1 Srs", 25244, 1],
  ["132kV DS 50kA 1kA E3Q12 BB2 Srs", 25245, 1],
  ["132kV DS 40kA 2kA E4Q11 BB1 Srs", 25246, 1],
  ["132kV DS 40kA 2kA E4Q12 BB2 Srs", 25247, 1],
  ["132kV DS 40kA 2kA E5Q11 BB1 Srs", 25248, 1],
  ["132kV DS 40kA 2kA E5Q12 BB2 Srs", 25249, 1],
  ["132kV DS 40kA 2kA E6Q11 BB1 Srs", 25250, 1],
  ["132kV DS 40kA 2kA E6Q12 BB2 Srs", 25251, 1],
  ["132kV DS 50kA 1kA E7Q11 BB1 Srs", 25252, 1],
  ["132kV DS 50kA 1kA E7Q12 BB2 Srs", 25253, 1],
  ["132kV DS 50kA 1kA 107 RIB Srs", 25254, 1],
  ["132kV DS 50kA 1kA E8Q11 BB1 Srs", 25255, 1],
  ["132kV DS 50kA 1kA E8Q12 BB2 Srs", 25256, 1],
  ["132kV DS 50kA 1kA 108 ZRK Srs", 25257, 1],
  ["132kV DS 40kA 2kA E9Q11 BB1 Srs", 25258, 1],
  ["132kV DS 40kA 2kA E9Q12 BB2 Srs", 25259, 1],
  ["132kV DS 20kA 1kA 109 SHB Srs", 25260, 1],
  ["132kV DS 40kA 2kA E10Q11 BB1 Srs", 25261, 1],
  ["132kV DS 40kA 2kA E10Q12 BB2 Srs", 25262, 1],
  ["132kV DS 20kA 1kA 110 CSD Srs", 25263, 1],
  ["132kV DS 50kA 1kA E11Q11 BB1 Srs", 25264, 1],
  ["132kV DS 50kA 1kA E11Q12 BB2 Srs", 25265, 1],
  ["132kV DS 30kA 1kA E12Q11 BB1 Srs", 25266, 1],
  ["132kV DS 40kA 2kA E12Q12 BB2 Srs", 25267, 1],
  ["132kV DS 40kA 2kA E13Q11 BB1 Srs", 25268, 1],
  ["132kV DS 40kA 2kA E13Q12 BB2 Srs", 25269, 1],
  ["132kV DS 40kA 2kA 113 DBN Srs", 25270, 1],
  ["132kV DS 40kA 2kA E14Q11 BB1 Srs", 25271, 1],
  ["132kV DS 40kA 2kA E14Q12 BB2 Srs", 25272, 1],
  ["132kV DS 40kA 2kA 114 CBK Srs", 25273, 1],
  ["132kV DS 40kA 2kA E15Q11 BB1 Srs", 25274, 1],
  ["132kV DS 40kA 2kA E15Q12 BB2 Srs", 25275, 1],
  ["132kV DS 30kA 2kA 115 MRD2 Srs", 25276, 1],
  ["132kV DS 30kA 1kA E16Q11 BB1 Srs", 25277, 1],
  ["132kV DS 30kA 1kA E16Q12 BB2 Srs", 25278, 1],
  ["132kV DS 40kA 1kA 116 MRD3 Srs", 25279, 1],
  ["132kV DS 40kA 2kA E17Q11 BB1 Srs", 25280, 1],
  ["132kV DS 40kA 2kA E17Q12 BB2 Srs", 25281, 1],
  ["132kV DS 30kA 1kA 117 JLA Srs", 25282, 1],
  ["132kV DS 50kA 1kA PT3 BB1 Srs", 25283, 1],
  ["132kV DS 50kA 1kA PT4 BB2 Srs", 25284, 1],
  ["132kV DS 40kA 2kA E18Q11 BB1 Srs", 25285, 1],
  ["132kV DS 40kA 2kA E18Q12 BB2 Srs", 25286, 1],
  ["132kV DS 40kA 2kA 118 JNG Srs", 25287, 1],
  ["132kV DS 40kA 2kA E19Q11 BB1 Srs", 25288, 1],
  ["132kV DS 40kA 2kA E19Q12 BB2 Srs", 25289, 1],
  ["132kV DS 40kA 2kA 119 DRG Srs", 25290, 1],
  ["220kV ES 30KA 1KA D1E10 TRB1", 25291, 0],
  ["220kV ES 30KA 1KA D2E10 TRB2", 25292, 0],
  ["220kV ES 30KA 1KA D4E10 NOW", 25293, 0],
  ["220kV ES 30KA 1KA D5E10 CKD", 25294, 0],
  ["132kV ES 40kA 2KA ES-1 REZ1", 25295, 0],
  ["132kV ES 40kA 2KA ES-2 REZ2", 25296, 0],
  ["132kV ES 50kA 1KA ES-7 RIB", 25297, 0],
  ["132kV ES 50kA 1KA ES-8 ZRK", 25298, 0],
  ["132kV ES 20KA 1KA ES-9 SHB", 25299, 0],
  ["132kV ES 20KA 1KA ES-10 CSD", 25300, 0],
  ["132kV ES 40KA 2KA ES-13 DBN", 25301, 0],
  ["132kV ES 30KA 1KA ES-15 MRD2", 25302, 0],
  ["132kV ES 40KA 2KA ES-16 MRD3", 25303, 0],
  ["132kV ES 30kA 1KA ES-17 JLA", 25304, 0],
  ["132kV ES 40KA 2KA ES-18 JNG", 25305, 0],
  ["132kV ES 40KA 2KA ES-19 DRG", 25306, 0],
];

export const STATUS_ROWS: DataRow[] = STATUS_ITEMS.map(([equipment, mp, value]) => ({
  equipment,
  unit: "EA",
  mpDescription: "OPEN / CLOSE STATUS",
  mp: String(mp),
  valuationCode: 1,
  fixedValue: value,
}));
