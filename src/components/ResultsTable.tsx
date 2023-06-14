import { Chain } from "wagmi";
import { ellipsis } from "../utils/ellipsis";
import { Result } from "../types";

const resultSortFn = (a: Result, b: Result) => {
  if (a.iteration !== b.iteration) {
    return a.iteration - b.iteration;
  }

  if (a.blockNumber !== b.blockNumber) {
    return a.blockNumber - b.blockNumber;
  }

  return a.order - b.order;
};

const ResultsTable = ({
  results,
  chain,
}: {
  results?: Result[];
  chain: Chain;
}) => {
  if (!results?.length) {
    return null;
  }

  const sortedResults = [...(results || [])].sort(resultSortFn);

  return (
    <div className="w-full">
      <h2 className="font-bold text-lg mb-2">{"SpeedTest Results"}</h2>
      <table className="min-w-full divide-y divide-gray-300 bg-white text-gray-800 rounded-lg overflow-hidden">
        <thead>
          <tr>
            <th
              scope="col"
              className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900"
            >
              {"Iteration"}
            </th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              {"Transaction"}
            </th>
            <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
              {"Block"}
            </th>
            <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
              {"Order"}
            </th>
            <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 whitespace-nowrap">
              {"First seen"}
            </th>
            <th
              scope="col"
              className="py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900"
            >
              {"RPC"}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {sortedResults?.map((result) => {
            return (
              <tr
                key={result.tx}
                className={
                  result.iteration % 2 === 0 ? "bg-gray-100" : "bg-white"
                }
              >
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                  {result.iteration}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-left overflow-hidden">
                  <a
                    title={result.tx}
                    className="text-underline hover:no-underline"
                    href={`${chain?.blockExplorers?.default.url}/tx/${result.tx}`}
                    target="_blank"
                    rel="noreferrer nofollow"
                  >
                    {ellipsis(result.tx, 8)}
                  </a>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                  <a
                    className="text-underline hover:no-underline"
                    href={`${chain?.blockExplorers?.default.url}/block/${result.tx}`}
                    target="_blank"
                    rel="noreferrer nofollow"
                  >
                    {result.blockNumber}
                  </a>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                  {result.order}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                  {result.firstSeen
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map((fs, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{fs.name}</span>
                        <span>{fs.date.getTime()}</span>
                      </div>
                    ))}
                </td>
                <td className="whitespace-nowrap py-4 pl-3 pr-4 text-sm font-medium text-gray-900 text-right">
                  {result.label}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
