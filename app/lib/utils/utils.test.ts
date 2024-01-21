import { expect, test } from "vitest"
import { getHrAndHrNoFromString } from "./utils.search"

test.each([
  ["b2021999_D01_テスト", { hr: "D", hrNo: 1 }],
  ["b2021999_J3_D12_テスト", { hr: "D", hrNo: 12 }],
  ["J3_E07_b2021999_テスト", { hr: "E", hrNo: 7 }],
  ["J3_E07_b2021999", { hr: "E", hrNo: 7 }],
  ["b2021999_J3_E07.pdf", { hr: "E", hrNo: 7 }],
  ["asdfjl_dsf-D9_s.pdf", { hr: "D", hrNo: 9 }],
  ["D09", { hr: "D", hrNo: 9 }],
  ["d9", { hr: "D", hrNo: 9 }],
  ["J3A_15", { hr: "A", hrNo: 15 }],
  ["j3a_19", { hr: "A", hrNo: 19 }],
  ["J3A_01", { hr: "A", hrNo: 1 }],
  ["H3a01", { hr: "A", hrNo: 1 }],
  ["h3a-1", { hr: "A", hrNo: 1 }],
  ["高1D 13", { hr: "D", hrNo: 13 }],
  ["中学1年A組13番", { hr: "A", hrNo: 13 }],
  ["A組13番", { hr: "A", hrNo: 13 }],
  ["高校2年E組 04番", { hr: "E", hrNo: 4 }],
  ["高校2年E組　04番", { hr: "E", hrNo: 4 }],
  ["E組4番", { hr: "E", hrNo: 4 }],
  ["中3A01", { hr: "A", hrNo: 1 }],
  ["高校3A01", { hr: "A", hrNo: 1 }],
  ["中学1A01", { hr: "A", hrNo: 1 }],
  ["J3_F02_勉強", { hr: "F", hrNo: 2 }],
])("getHrAndHrNoFromString(%s) -> %s", (a, expected) => {
  expect(getHrAndHrNoFromString(a)).toEqual(expected)
})

/*
test.each([
  [1, 1, 2],
  [1, 2, 3],
  [2, 1, 3],
])('add(%i, %i) -> %i', (a, b, expected) => {
  expect(a + b).toBe(expected)
})

// this will return
// ✓ add(1, 1) -> 2
// ✓ add(1, 2) -> 3
// ✓ add(2, 1) -> 3



  // @todo actions/search.ts: NEED TO REFACTOR this regex, create separate function
  // for 中学1年A組13番
  const rx1 = /(中学|高校)\d?(年)?.*(?<hr>[a-eA-E])組(?<hrNo>[0-9]{1,2})番/g
  // A組12番
  const rx2 = /(?<hr>[a-eA-E])組(?<hrNo>[0-9]{1,2})番/g
  // J3A09
  const rx3 = /[jJhH中高]\d?(?<hr>[a-eA-E])[\s_-]?(?<hrNo>[0-9]{1,2})/g
  // D01
  const rx4 = /(?<hr>[a-eA-E])(?<hrNo>[0-9]{1,2})/g

  const rxArr = [rx1, rx2, rx3, rx4]

  let rxRes: { hr?: Hr; hrNo?: string } = { hr: undefined, hrNo: undefined }
  for (let rx of rxArr) {
    rxRes = rx.exec(joinedSegments)?.groups as {
      hr?: Hr
      hrNo?: string
    }
    console.log("✅ rxRes", rxRes)
    if (rxRes?.hr && rxRes?.hrNo) break
  }

  // look up student by Hr, HrNo, and Gakunen
  if (gakunen !== `ALL`) {
    console.log("✅ gakunen !== `ALL`")
    // const rx = /(?<hr>[A-F])組(?<hrNo>[0-9]{1,2})番/g

    J3A_15
    j3a_01
    J3A_01
    j3a01
    j3a-1
    中3A01
    高1B 13
    中学1年A組13番
    高校2年E組 04番
    高校3A01
    中学1A01
    // const rx = /([jJhH中高]|(中学|高校))?\d?(年)?.*(?<hr>[a-eA-E]).*(?<hrNo>[0-9]{1,2}.?)/g

    // const rx = new RegExp(`(${rx1.source})|(${rx2.source})|(${rx3.source}`)
    // const rxRes = rx.exec(joinedSegments)?.groups as {
    //   hr: Hr
    //   hrNo: string
    // }
*/
