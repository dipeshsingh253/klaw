import { Switch } from "@aivenio/aquarium";
import { useSearchParams } from "react-router-dom";

function MyRequestFilter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMyRequest = searchParams.get("isMyRequest") === "true";

  const handleChangeIsMyRequest = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      searchParams.set("isMyRequest", "true");
    } else {
      searchParams.delete("isMyRequest");
    }
    searchParams.set("page", "1");
    setSearchParams(searchParams);
  };

  return (
    <Switch checked={isMyRequest} onChange={handleChangeIsMyRequest}>
      Show only my requests
    </Switch>
  );
}

export { MyRequestFilter };
