import { createHourlyBucket, createHourlyCounts } from "../index.js";

describe('function createHourlyBucket', () => {
  test('when timestampA and timestampB are valid, different times', () => {
    const buckets = createHourlyBucket('2021-03-01T02:30:00.00Z', '2021-03-01T05:50:00.00Z');
    expect(buckets.length).toEqual(4);
    expect(buckets).toEqual(["2021-03-01T02:00:00.000Z", "2021-03-01T03:00:00.000Z", "2021-03-01T04:00:00.000Z", "2021-03-01T05:00:00.000Z"])
  });

  test('when timestampA and timestampB are the same', () => {
    const timestamp = '2021-03-01T03:30:00.00Z';
    const buckets = createHourlyBucket(timestamp,timestamp);
    expect(buckets.length).toEqual(1);
    expect(buckets[0]).toEqual('2021-03-01T03:00:00.000Z')
  });

  test('when timestampA and timestampB are different but within the same hour', () => {
    expect(createHourlyBucket('2021-03-01T03:30:00.00Z', '2021-03-01T03:50:00.00Z')).toEqual(["2021-03-01T03:00:00.000Z"])
  });

  test('when timestampA and timestampB are different and with different hours but same minutes or seconds or milliseconds', () => {
    const buckets = createHourlyBucket("2021-03-01T02:30:00.00Z", "2021-03-01T03:30:00.00Z");
    expect(buckets.length).toEqual(2);
    expect(buckets).toEqual(['2021-03-01T02:00:00.000Z', '2021-03-01T03:00:00.000Z']);
  });

  test('when timestampA and timestampB are overnight', () => {
    const buckets = createHourlyBucket('2021-03-01T03:30:00.00Z', '2021-03-02T03:50:00.00Z');
    expect(buckets.length).toEqual(25);
    expect(buckets).toEqual([
      '2021-03-01T03:00:00.000Z','2021-03-01T04:00:00.000Z','2021-03-01T05:00:00.000Z',
      '2021-03-01T06:00:00.000Z','2021-03-01T07:00:00.000Z','2021-03-01T08:00:00.000Z','2021-03-01T09:00:00.000Z',
      '2021-03-01T10:00:00.000Z','2021-03-01T11:00:00.000Z','2021-03-01T12:00:00.000Z','2021-03-01T13:00:00.000Z',
      '2021-03-01T14:00:00.000Z','2021-03-01T15:00:00.000Z','2021-03-01T16:00:00.000Z','2021-03-01T17:00:00.000Z',
      '2021-03-01T18:00:00.000Z','2021-03-01T19:00:00.000Z','2021-03-01T20:00:00.000Z','2021-03-01T21:00:00.000Z',
      '2021-03-01T22:00:00.000Z','2021-03-01T23:00:00.000Z','2021-03-02T00:00:00.000Z','2021-03-02T01:00:00.000Z',
      '2021-03-02T02:00:00.000Z','2021-03-02T03:00:00.000Z'])
  });

  test('when timestamp is not valid it throws error', () => {
    expect(() => createHourlyBucket('foo', 'bar')).toThrow('Please provide valid timestamps')
  })
});


describe('createHourlyCounts', () => {
  const mockedData = [  {
    customer_id: 'b4f9279a0196e40632e947dd1a88e857',
    event_type: 'INGEST',
    transaction_id: '7922c707-57dd-44b0-8390-61ab38fff64d',
    timestamp: '2021-03-01 00:04:07.215+00'
  },
  {
    customer_id: 'b4f9279a0196e40632e947dd1a88e857',
    event_type: 'INGEST',
    transaction_id: '26355ece-04b9-4774-b931-ea4b6ac367a7',
    timestamp: '2021-03-01 00:04:07.215+00'
  },
  {
    customer_id: 'b4f9279a0196e40632e947dd1a88e857',
    event_type: 'INGEST',
    transaction_id: 'a0b21ace-a9d2-4f61-85fb-338f7ea77e00',
    timestamp: '2021-03-01 00:04:17.731+00'
  }]

  test('when there are events that fall within given timestamps it lists events', () => {
    const buckets = createHourlyBucket('2021-03-01 00:04:05.215+00', '2021-03-01 00:04:25.731+00')
    expect(createHourlyCounts(mockedData, 'b4f9279a0196e40632e947dd1a88e857', '2021-03-01 00:04:05.215+00', '2021-03-01 00:04:25.731+00', buckets)).toEqual({"2021-03-01T00:00:00.000Z": 3})
  })

  test('when there are no events that fall within given timestamps it lists events', () => {
    const buckets = createHourlyBucket('2021-03-01 00:02:05.215+00', '2021-03-01 00:02:25.731+00')
    expect(createHourlyCounts(mockedData, 'b4f9279a0196e40632e947dd1a88e857', '2021-03-01 00:02:05.215+00', '2021-03-01 00:02:25.731+00', buckets)).toEqual({"2021-03-01T00:00:00.000Z": 0})
  }
  )
});
