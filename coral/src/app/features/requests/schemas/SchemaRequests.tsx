import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pagination } from "src/app/components/Pagination";
import { TableLayout } from "src/app/features/components/layouts/TableLayout";
import RequestDetailsModal from "src/app/features/components/RequestDetailsModal";
import { SchemaRequestDetails } from "src/app/features/components/SchemaRequestDetails";
import EnvironmentFilter from "src/app/features/components/table-filters/EnvironmentFilter";
import { MyRequestsFilter } from "src/app/features/components/table-filters/MyRequestsFilter";
import StatusFilter from "src/app/features/components/table-filters/StatusFilter";
import TopicFilter from "src/app/features/components/table-filters/TopicFilter";
import { SchemaRequestTable } from "src/app/features/requests/schemas/components/SchemaRequestTable";
import {
  RequestOperationType,
  RequestStatus,
} from "src/domain/requests/requests-types";
import {
  getSchemaRequests,
  deleteSchemaRequest,
} from "src/domain/schema-request";
import { DeleteRequestDialog } from "src/app/features/requests/components/DeleteRequestDialog";
import { parseErrorMsg } from "src/services/mutation-utils";
import { Alert } from "@aivenio/aquarium";
import { objectHasProperty } from "src/services/type-utils";
import { OperationTypeFilter } from "src/app/features/components/table-filters/OperationTypeFilter";

const defaultStatus = "ALL";
const defaultType = "ALL";

function SchemaRequests() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = searchParams.get("page")
    ? Number(searchParams.get("page"))
    : 1;
  const currentTopic = searchParams.get("topic") ?? undefined;
  const currentEnvironment = searchParams.get("environment") ?? "ALL";
  const currentType =
    (searchParams.get("operationType") as RequestOperationType | "ALL") ??
    defaultType;
  const currentStatus =
    (searchParams.get("status") as RequestStatus) ?? defaultStatus;
  const showOnlyMyRequests =
    searchParams.get("showOnlyMyRequests") === "true" ? true : undefined;

  const [modals, setModals] = useState<{
    open: "DETAILS" | "DELETE" | "NONE";
    req_no: number | null;
  }>({ open: "NONE", req_no: null });

  const [errorQuickActions, setErrorQuickActions] = useState("");

  const {
    data: schemaRequests,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: [
      "getSchemaRequests",
      currentPage,
      currentEnvironment,
      currentStatus,
      currentTopic,
      showOnlyMyRequests,
      currentType,
    ],
    queryFn: () =>
      getSchemaRequests({
        pageNo: String(currentPage),
        env: currentEnvironment,
        requestStatus:
          currentStatus !== defaultStatus ? currentStatus : undefined,
        topic: currentTopic,
        isMyRequest: showOnlyMyRequests,
        operationType: currentType !== defaultType ? currentType : undefined,
      }),
    keepPreviousData: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mutate: deleteRequest, isLoading: deleteRequestIsLoading } =
    useMutation(deleteSchemaRequest, {
      onSuccess: (responses) => {
        // @TODO follow up ticket #707
        // (for all approval and request tables)
        const response = responses[0];
        const responseIsAHiddenError = response?.result !== "success";
        if (responseIsAHiddenError) {
          throw new Error(response?.message || response?.result);
        }
        setErrorQuickActions("");
        // We need to refetch all requests to keep Table state in sync
        queryClient.refetchQueries(["getSchemaRequests"]).then(() => {
          // only close the modal when data in background is updated
          closeModal();
        });
      },
      onError(error: Error) {
        let errorMessage: string;
        // if error comes from our api, it has a `data` property
        // parseErrorMsg makes sure to get the right message
        // OR set a generic error message
        if (objectHasProperty(error, "data")) {
          errorMessage = parseErrorMsg(error);
        } else {
          errorMessage = error.message;
        }

        setErrorQuickActions(errorMessage);
        closeModal();
      },
    });

  function closeModal() {
    setModals({ open: "NONE", req_no: null });
  }

  const openDetailsModal = (req_no: number) => {
    setModals({ open: "DETAILS", req_no });
  };

  const openDeleteModal = (req_no: number) => {
    setModals({ open: "DELETE", req_no });
  };

  function setCurrentPage(page: number) {
    searchParams.set("page", page.toString());
    setSearchParams(searchParams);
  }

  const pagination =
    schemaRequests?.totalPages && schemaRequests.totalPages > 1 ? (
      <Pagination
        activePage={schemaRequests.currentPage}
        totalPages={schemaRequests?.totalPages}
        setActivePage={setCurrentPage}
      />
    ) : undefined;

  return (
    <>
      {modals.open === "DETAILS" && (
        <RequestDetailsModal
          onClose={closeModal}
          actions={{
            primary: {
              text: "Close",
              onClick: () => {
                if (modals.req_no === null) {
                  throw Error("req_no can't be null");
                }
                closeModal();
              },
            },
            secondary: {
              text: "Delete",
              onClick: () => {
                if (modals.req_no === null) {
                  throw Error("req_no can't be null");
                }
                openDeleteModal(modals.req_no);
              },
            },
          }}
          isLoading={false}
        >
          <SchemaRequestDetails
            request={schemaRequests?.entries.find(
              (request) => request.req_no === modals.req_no
            )}
          />
        </RequestDetailsModal>
      )}

      {modals.open === "DELETE" && (
        <DeleteRequestDialog
          deleteRequest={() => {
            if (modals.req_no === null) {
              throw Error("req_no can't be null");
            } else {
              deleteRequest({ reqIds: [modals.req_no.toString()] });
            }
          }}
          isLoading={deleteRequestIsLoading || isFetching}
          cancel={closeModal}
        />
      )}
      {errorQuickActions && (
        <div role="alert">
          <Alert type="error">{errorQuickActions}</Alert>
        </div>
      )}
      <TableLayout
        filters={[
          <EnvironmentFilter
            key={"environments"}
            isSchemaRegistryEnvironments
          />,
          <OperationTypeFilter key={"request-type"} />,
          <StatusFilter key={"request-status"} defaultStatus={defaultStatus} />,
          <TopicFilter key={"topic"} />,
          <MyRequestsFilter key={"show-only-my-requests"} />,
        ]}
        table={
          <SchemaRequestTable
            requests={schemaRequests?.entries || []}
            showDetails={openDetailsModal}
            showDeleteDialog={openDeleteModal}
          />
        }
        pagination={pagination}
        isLoading={isLoading}
        isErrorLoading={isError}
        errorMessage={error}
      />
    </>
  );
}

export { SchemaRequests };
