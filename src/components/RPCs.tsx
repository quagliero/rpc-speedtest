import { Dispatch, SetStateAction, useEffect, useState } from "react";

const RPCs = ({
  urls,
  setUrls,
}: {
  urls: string[];
  setUrls: Dispatch<SetStateAction<string[]>>;
}) => {
  const [rpcUrls, setRpcUrls] = useState(() =>
    urls.map((x) => ({
      url: x,
      editable: false,
    }))
  );
  const [selectedUrls, setSelectedUrls] = useState(() =>
    rpcUrls.map((x) => x.url)
  );

  useEffect(() => {
    setUrls(selectedUrls);
  }, [selectedUrls]);

  const handleRpcChange = (url: string) => {
    setSelectedUrls((urls) => {
      if (urls.includes(url)) {
        const newUrls = urls.slice(0);
        const idx = urls.indexOf(url);
        newUrls.splice(idx, 1);

        return newUrls;
      }

      return [...urls, url.trim()];
    });
  };

  return (
    <>
      <fieldset>
        <legend className="text-base font-semibold leading-6 text-gray-900">
          {"Selected RPCs"}
        </legend>
        <div className="mt-4 divide-y divide-gray-200 border-b border-t border-gray-200">
          {rpcUrls.map((rpc, i) => (
            <label
              htmlFor={`rpc-${rpc.url}`}
              key={i}
              className={`relative flex items-center p-2 cursor-pointer hover:bg-indigo-50/50 ${
                !selectedUrls.includes(rpc.url) ? "opacity-75" : ""
              }`}
            >
              <div className="min-w-0 flex-1 text-sm leading-6">
                <span className="font-medium text-gray-900">
                  {rpc.editable ? (
                    <input
                      type="text"
                      className="block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      placeholder="e.g. https://some-rpc.com/"
                      onChange={(e) =>
                        setRpcUrls((rpcs) => {
                          return rpcs.map((rpc, j) => {
                            if (i === j) {
                              return {
                                ...rpc,
                                url: e.target.value.trim(),
                              };
                            }

                            return rpc;
                          });
                        })
                      }
                    />
                  ) : (
                    rpc.url
                  )}
                </span>
              </div>
              <div className="ml-3 flex h-6 items-center">
                <input
                  id={`rpc-${rpc.url}`}
                  name={`rpc-${rpc.url}`}
                  type="checkbox"
                  checked={selectedUrls.includes(rpc.url)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 accent-indigo-600"
                  onChange={() => handleRpcChange(rpc.url)}
                />
              </div>
            </label>
          ))}
        </div>
        <div className="py-2 text-right">
          <button
            onClick={() =>
              setRpcUrls((x) => [...x, { editable: true, url: "" }])
            }
            className="rounded-full border-indigo-600 border-2 px-2 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {"+ Custom RPC"}
          </button>
        </div>
      </fieldset>
    </>
  );
};

export default RPCs;
