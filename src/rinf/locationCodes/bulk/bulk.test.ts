/*
 *  Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
the European Commission - subsequent versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at:

  https://joinup.ec.europa.eu/software/page/eupl

Unless required by applicable law or agreed to in writing, software
distributed under the Licence is distributed on an "AS IS" basis,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the Licence for the specific language governing permissions and
limitations under the Licence.

Added for the ERA Location Code Manager, 2026-11-10. */

import { afterEach, describe, expect, it } from "vitest";
import type { CodeVersion } from "../model/CodeVersion";
import { BULK_COLUMNS, bulkTemplateCsv, MAX_BULK_LINES } from "./bulkColumns";
import { readBulkFile } from "./bulkFile";
import { countriesToAsk } from "./bulkRegisterChecks";
import type { BulkReport, CheckedLine } from "./bulkReport";
import { bulkReportCsv } from "./bulkReportCsv";
import { checkBulkLines } from "./checkBulkLines";
import { parseCsv } from "./parseCsv";

const TODAY = "2026-11-10";
const HEADER = BULK_COLUMNS.join(",");

/** The example of Annex A.4. */
const ANNEX_EXAMPLE = [
  HEADER,
  "PLC,SE,,,,,Myrbacken,,0074,SE00111,,SE110,0,1,1,,,1,,,,,,Border point without a code",
  'PLC,BE,1500,,,,"Y Fleurus, Est",Y Fleurus Est,0088,,2027-01-01,,0,1,1,,,0,,,,,,',
  "SLC,BE,438,01,0000000003,0088,Gembloux voie III,,,,,,,,,,,,,,,,,Track code for path requests",
].join("\n");

const version = (changes: Partial<CodeVersion>): CodeVersion =>
  ({
    key: "BE00438",
    version: 1,
    codeType: "primary",
    code: "BE00438",
    countryIsoCode: "BE",
    startValidity: "2020-01-01",
    endValidity: null,
    ...changes,
  }) as CodeVersion;

const KNOWLEDGE_GRAPH = new Set(["BE00438"]);

const check = (
  content: string,
  register: CodeVersion[] = [],
  knowledgeGraphCodes: Set<string> | null = KNOWLEDGE_GRAPH,
): CheckedLine[] => {
  const { problems, lines } = readBulkFile(content);
  expect(problems).toEqual([]);
  return checkBulkLines(lines, { today: TODAY, register, knowledgeGraphCodes });
};

/** A file with the given columns and one line of values. */
const oneLine = (values: Record<string, string>): string =>
  `${Object.keys(values).join(",")}\n${Object.values(values).join(",")}`;

const PLC_LINE = {
  Code_Type: "PLC",
  Country_ISO_code: "BE",
  Location_Name: "X",
  Responsible_IM_Code: "0088",
};
const SLC_LINE = {
  Code_Type: "SLC",
  Country_ISO_code: "BE",
  Primary_Location_Code: "438",
  Subsidiary_Type_Code: "1",
  Allocation_Company_Code: "0088",
  Location_Name: "X",
};

/** "Column rule message" of each failure of the first line. */
const failuresOf = (lines: CheckedLine[], index = 0): string[] =>
  lines[index].failures.map(
    ({ column, rule, messageId }) =>
      `${column ?? "-"} ${rule} ${messageId.replace("rinf_lc_bulk_", "")}`,
  );

describe("parseCsv", () => {
  it("reads quoted fields with commas, quotes and line breaks", () => {
    const { records, unclosedQuoteLine } = parseCsv(
      '﻿a,b\r\n"x, y","say ""hi"""\n\n"two\nlines",z\n',
    );
    expect(unclosedQuoteLine).toBeNull();
    expect(records).toEqual([
      { line: 1, fields: ["a", "b"] },
      { line: 2, fields: ["x, y", 'say "hi"'] },
      { line: 4, fields: ["two\nlines", "z"] },
    ]);
  });

  it("tells where a quote is left open", () => {
    expect(parseCsv('a,b\n1,"open\n2,3').unclosedQuoteLine).toBe(2);
  });
});

describe("the file checks", () => {
  const problemOf = (content: string) => {
    const [problem] = readBulkFile(content).problems;
    return problem
      ? `${problem.messageId.replace("rinf_lc_bulk_file_", "")} ${Object.values(problem.values ?? {}).join("|")}`
      : null;
  };

  it("accept the template's header with the annex's example", () => {
    expect(bulkTemplateCsv()).toBe(`${HEADER}\n`);
    expect(HEADER.split(",")).toHaveLength(24);
    const { problems, lines } = readBulkFile(ANNEX_EXAMPLE);
    expect(problems).toEqual([]);
    expect(lines.map((line) => line.line)).toEqual([2, 3, 4]);
    expect(lines[1].values.Location_Name).toBe("Y Fleurus, Est");
  });

  it("refuse a file that is not the template's", () => {
    expect(problemOf("")).toBe("empty ");
    expect(problemOf(HEADER)).toBe("no_lines ");
    expect(problemOf("Code_Type;Country_ISO_code\nPLC;BE")).toBe(
      "unknown_columns Code_Type;Country_ISO_code",
    );
    expect(problemOf("Code_Type,End_Validity,Operation\nPLC,,")).toBe(
      "unknown_columns End_Validity, Operation",
    );
    expect(problemOf("Code_Type,Code_Type\nPLC,PLC")).toBe(
      "duplicate_columns Code_Type",
    );
    expect(problemOf('Code_Type\n"PLC')).toBe("quote 2");
  });

  it("want the columns the file's lines require, and no more", () => {
    expect(problemOf("Country_ISO_code,Location_Name\nBE,X")).toBe(
      "missing_columns Code_Type",
    );
    expect(
      problemOf("Code_Type,Country_ISO_code,Location_Name\nPLC,BE,X"),
    ).toBe("missing_columns Responsible_IM_Code");
    expect(problemOf(oneLine(PLC_LINE))).toBeNull();
    expect(problemOf(oneLine({ ...PLC_LINE, Code_Type: "SLC" }))).toBe(
      "missing_columns Primary_Location_Code, Subsidiary_Type_Code, Allocation_Company_Code",
    );
  });

  it("take at most 500 lines", () => {
    const lines = (count: number) =>
      [
        Object.keys(PLC_LINE).join(","),
        ...Array(count).fill("PLC,BE,X,0088"),
      ].join("\n");
    expect(problemOf(lines(MAX_BULK_LINES))).toBeNull();
    expect(problemOf(lines(MAX_BULK_LINES + 1))).toBe("too_many 501|500");
  });
});

describe("the line checks", () => {
  it("accept the annex's example", () => {
    const lines = check(ANNEX_EXAMPLE);
    expect(lines.map((line) => failuresOf([line]))).toEqual([[], [], []]);
    expect(lines.map((line) => line.codeType)).toEqual(["PLC", "PLC", "SLC"]);
  });

  it("report every failure of a line", () => {
    const lines = check(
      oneLine({
        ...PLC_LINE,
        Country_ISO_code: "be",
        Primary_Location_Code: "0",
        Responsible_IM_Code: "88",
        Location_Name_ASCII: "Zürich",
        Start_Validity: "2026-02-30",
        Container_Handling_Flag: "yes",
        Freight_Possible_Flag: "0",
        Freight_Start_Validity: "2026-01-01",
        Passenger_Possible_Flag: "1",
        Passenger_Start_Validity: "2026-06-01",
        Passenger_End_Validity: "2026-01-01",
        Latitude: '"50,57"',
        Longitude: "4.69",
        Free_Text: "null",
        Subsidiary_Type_Code: "01",
      }),
    );
    expect(failuresOf(lines)).toEqual([
      "Free_Text A1 null_word",
      "Subsidiary_Type_Code FILE unused",
      "Country_ISO_code A1 country_format",
      "Location_Name_ASCII A1 ascii",
      "Start_Validity A1 date",
      "Latitude A1 latitude",
      "Primary_Location_Code A1 location_number",
      "Responsible_IM_Code BR-06 company_code",
      "Container_Handling_Flag A1 flag",
      "Freight_Start_Validity A1 validity_without_flag",
      "Passenger_End_Validity A1 validity_order",
    ]);
  });

  it("want a kind, the required values and as many fields as the header", () => {
    expect(
      failuresOf(check(oneLine({ ...PLC_LINE, Code_Type: "plc" }))),
    ).toEqual(["Code_Type A1 code_type"]);
    expect(
      failuresOf(check(oneLine({ ...PLC_LINE, Location_Name: "" }))),
    ).toEqual(["Location_Name A1 required"]);
    const short = `${Object.keys(PLC_LINE).join(",")}\nPLC,BE,X`;
    expect(failuresOf(check(short))).toEqual(["- FILE line_fields"]);
    expect(
      failuresOf(
        check(oneLine({ ...PLC_LINE, Latitude: "50.5", Longitude: "" })),
      ),
    ).toEqual(["Longitude A1 coordinate_pair"]);
  });

  it("read countries and subsidiary types from the master data", () => {
    expect(
      failuresOf(check(oneLine({ ...PLC_LINE, Country_ISO_code: "XX" }))),
    ).toEqual(["Country_ISO_code A1 country_unknown"]);
    expect(
      failuresOf(check(oneLine({ ...SLC_LINE, Subsidiary_Type_Code: "02" }))),
    ).toEqual(["Subsidiary_Type_Code BR-08 type_unknown"]);
    expect(
      failuresOf(check(oneLine({ ...SLC_LINE, Subsidiary_Type_Code: "x" }))),
    ).toEqual(["Subsidiary_Type_Code A1 type_format"]);
  });
});

describe("the checks against existing codes", () => {
  it("refuse a proposed PLC already in the register", () => {
    const proposing = (value: string) =>
      oneLine({ ...PLC_LINE, Primary_Location_Code: value });
    const closed = version({ endValidity: "2021-01-01" });
    expect(failuresOf(check(proposing("438"), [closed]))).toEqual([
      "Primary_Location_Code BR-10 code_taken",
    ]);
    expect(failuresOf(check(proposing("00439"), [closed]))).toEqual([]);
  });

  it("want an SLC's parent active when the SLC starts", () => {
    const slc = (changes: Record<string, string> = {}) =>
      oneLine({ ...SLC_LINE, ...changes });
    const parent = version({});
    expect(failuresOf(check(slc(), [parent], null))).toEqual([]);
    expect(failuresOf(check(slc(), [], KNOWLEDGE_GRAPH))).toEqual([]);
    expect(failuresOf(check(slc(), [], new Set()))).toEqual([
      "Primary_Location_Code BR-02 parent_missing",
    ]);
    expect(failuresOf(check(slc(), [], null))).toEqual([
      "Primary_Location_Code BR-02 parent_unchecked",
    ]);
    expect(
      failuresOf(check(slc(), [version({ endValidity: "2026-01-01" })])),
    ).toEqual(["Primary_Location_Code BR-02 parent_closed"]);
    expect(
      failuresOf(check(slc({ Start_Validity: "2019-06-01" }), [parent])),
    ).toEqual(["Primary_Location_Code BR-14 start_before_parent"]);
  });

  it("refuse an SLC value the parent already has", () => {
    const existing = version({
      key: "BE00438/0000000003",
      codeType: "subsidiary",
      code: "0000000003",
      parentPrimaryCode: "BE00438",
    });
    const proposing = oneLine({
      ...SLC_LINE,
      Subsidiary_Location_Code: "0000000003",
    });
    expect(failuresOf(check(proposing, [version({}), existing]))).toEqual([
      "Subsidiary_Location_Code BR-10 subsidiary_taken",
    ]);
  });

  it("ask the Knowledge Graph only for parents the register lacks", () => {
    const { lines } = readBulkFile(
      [
        Object.keys(SLC_LINE).join(","),
        "SLC,BE,438,1,0088,X",
        "SLC,NO,198,1,0076,Y",
        "SLC,NO,199,1,0076,Z",
      ].join("\n"),
    );
    expect(countriesToAsk(lines, [version({})])).toEqual(["NO"]);
    const proposing = readBulkFile(
      oneLine({
        ...PLC_LINE,
        Country_ISO_code: "IT",
        Primary_Location_Code: "5",
      }),
    );
    expect(countriesToAsk(proposing.lines, [])).toEqual(["IT"]);
    expect(countriesToAsk(readBulkFile(oneLine(PLC_LINE)).lines, [])).toEqual(
      [],
    );
  });
});

describe("the checks between lines", () => {
  it("refuse both lines that propose the same code", () => {
    const lines = check(
      [
        "Code_Type,Country_ISO_code,Primary_Location_Code,Location_Name,Responsible_IM_Code",
        "PLC,BE,1500,X,0088",
        "PLC,BE,01500,Y,0088",
        "PLC,FR,1500,Z,0087",
        "PLC,BE,,W,0088",
        "PLC,BE,,V,0088",
      ].join("\n"),
    );
    expect(lines.map((line) => failuresOf([line]))).toEqual([
      ["Primary_Location_Code FILE same_code_twice"],
      ["Primary_Location_Code FILE same_code_twice"],
      [],
      [],
      [],
    ]);
    expect(lines[0].failures[0].values).toEqual({ lines: "3" });
  });

  it("refuse an SLC twice, or with its parent asked for in the same file", () => {
    const columns =
      "Code_Type,Country_ISO_code,Primary_Location_Code,Subsidiary_Type_Code,Subsidiary_Location_Code,Allocation_Company_Code,Location_Name,Responsible_IM_Code";
    const lines = check(
      [
        columns,
        "PLC,BE,1500,,,,New place,0088",
        "SLC,BE,1500,01,,0088,Track there,",
        "SLC,BE,438,01,7,0088,Track A,",
        "SLC,BE,438,1,7,0088,Track B,",
        "SLC,BE,438,15,7,0088,Platform,",
      ].join("\n"),
    );
    expect(lines.map((line) => failuresOf([line]))).toEqual([
      [],
      ["Primary_Location_Code BR-02 parent_in_file"],
      ["Subsidiary_Location_Code FILE same_subsidiary_twice"],
      ["Subsidiary_Location_Code FILE same_subsidiary_twice"],
      [],
    ]);
  });
});

describe("the report file", () => {
  it("has one row per accepted line and one per failure", () => {
    const report: BulkReport = {
      fileName: "codes.csv",
      fileProblems: [],
      lines: check(
        [Object.keys(PLC_LINE).join(","), "PLC,BE,X,0088", "PLC,be,,88"].join(
          "\n",
        ),
      ),
      knowledgeGraphReached: true,
      registerReached: true,
      source: [],
      existingCodes: [],
    };
    const formatMessage = (({ id }: { id: string }, values?: object) =>
      `${id}${values ? ` ${JSON.stringify(values)}` : ""}`) as never;
    expect(bulkReportCsv(report, formatMessage)).toBe(
      [
        "line,result,item_ref,column,rule,message",
        "2,ACCEPTED,,,,",
        "3,REFUSED,,Location_Name,A1,rinf_lc_bulk_required",
        "3,REFUSED,,Country_ISO_code,A1,rinf_lc_bulk_country_format",
        "3,REFUSED,,Responsible_IM_Code,BR-06,rinf_lc_bulk_company_code",
        "",
      ].join("\n"),
    );
  });
});
