import { Box, useToast } from "@aivenio/aquarium";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Navigate,
  useLocation,
  useMatches,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { ClaimBanner } from "src/app/features/components/ClaimBanner";
import { ClaimConfirmationModal } from "src/app/features/components/ClaimConfirmationModal";
import { EntityDetailsHeader } from "src/app/features/components/EntityDetailsHeader";
import { ConnectorOverviewResourcesTabs } from "src/app/features/connectors/details/components/ConnectorOverviewResourcesTabs";
import {
  CONNECTOR_OVERVIEW_TAB_ID_INTO_PATH,
  ConnectorOverviewTabEnum,
  isConnectorsOverviewTabEnum,
} from "src/app/router_utils";
import { ConnectorOverview, requestConnectorClaim } from "src/domain/connector";
import { getConnectorOverview } from "src/domain/connector/connector-api";
import { HTTPError } from "src/services/api";
import { parseErrorMsg } from "src/services/mutation-utils";

type ConnectorOverviewProps = {
  connectorName: string;
};

function findMatchingTab(
  matches: ReturnType<typeof useMatches>
): ConnectorOverviewTabEnum | undefined {
  const match = matches
    .map((match) => match.id)
    .find((id) =>
      Object.prototype.hasOwnProperty.call(
        CONNECTOR_OVERVIEW_TAB_ID_INTO_PATH,
        id
      )
    );
  if (isConnectorsOverviewTabEnum(match)) {
    return match;
  }
  return undefined;
}

function ConnectorDetails(props: ConnectorOverviewProps) {
  const { connectorName } = props;
  // This state comes from the topic Link components in ConnectorTable
  const { state: initialEnvironment }: { state: string | null } = useLocation();

  const [showClaimModal, setShowClaimModal] = useState(false);

  const [claimErrorMessage, setClaimErrorMessage] = useState<
    string | undefined
  >();

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState(
    searchParams.get("env") ?? initialEnvironment ?? undefined
  );

  const toast = useToast();

  const matches = useMatches();

  const currentTab = findMatchingTab(matches);

  const {
    data: connectorData,
    isError: connectorIsError,
    error: connectorError,
    isLoading: connectorIsLoading,
    isRefetching: connectorIsRefetching,
    refetch: refetchConnectors,
  } = useQuery({
    queryKey: ["connector-overview", connectorName, selectedEnvironmentId],
    queryFn: () =>
      getConnectorOverview({
        connectornamesearch: connectorName,
        environmentId: selectedEnvironmentId,
      }),
  });

  const {
    mutate: createClaimConnectorRequest,
    isLoading: isLoadingCreateClaimConnectorRequest,
    isError: isErrorCreateClaimConnectorRequest,
  } = useMutation(
    ({
      remark,
      connectorName,
      env,
    }: {
      remark?: string;
      connectorName: string;
      env: string;
    }) =>
      requestConnectorClaim({
        connectorName,
        env,
        remark,
      }),
    {
      onSuccess: () => {
        refetchConnectors().then(() => {
          toast({
            message: "Connector claim request successfully created",
            position: "bottom-left",
            variant: "default",
          });
        });
      },
      onError: (error: HTTPError) => {
        setClaimErrorMessage(parseErrorMsg(error));
      },
      onSettled: () => {
        setShowClaimModal(false);
      },
    }
  );

  useEffect(() => {
    if (
      connectorData?.availableEnvironments !== undefined &&
      selectedEnvironmentId === undefined
    ) {
      setSelectedEnvironmentId(connectorData?.availableEnvironments[0].id);
    }
  }, [
    connectorData?.availableEnvironments,
    selectedEnvironmentId,
    setSelectedEnvironmentId,
  ]);

  if (currentTab === undefined) {
    return (
      <Navigate to={`/connector/${connectorName}/overview`} replace={true} />
    );
  }

  function submitRequest(remark: string | undefined) {
    if (connectorData?.connectorInfo === undefined) {
      console.error(
        "Users should never be able to access the request when connectorData is not set."
      );
      return;
    }
    createClaimConnectorRequest({
      remark,
      connectorName: connectorData.connectorInfo.connectorName,
      env: connectorData.connectorInfo.environmentId,
    });
  }

  return (
    <>
      {showClaimModal && (
        <ClaimConfirmationModal
          onSubmit={(remark) => submitRequest(remark)}
          onClose={() => setShowClaimModal(false)}
          isLoading={isLoadingCreateClaimConnectorRequest}
          entity={"connector"}
        />
      )}
      <EntityDetailsHeader
        entity={{ name: connectorName, type: "connector" }}
        entityExists={Boolean(connectorData?.connectorExists)}
        entityUpdating={connectorIsRefetching}
        entityEditLink={`/connector/${connectorName}/request-update?env=${selectedEnvironmentId}`}
        environments={connectorData?.availableEnvironments}
        environmentId={selectedEnvironmentId}
        setEnvironmentId={(id: string) => {
          setSelectedEnvironmentId(id);
          setSearchParams({ env: id });
        }}
        showEditButton={Boolean(connectorData?.connectorInfo.showEditConnector)}
        hasPendingRequest={Boolean(connectorData?.connectorInfo.hasOpenRequest)}
      />

      {connectorData?.connectorInfo !== undefined &&
        !connectorData.connectorInfo.connectorOwner && (
          <Box marginBottom={"l1"}>
            <ClaimBanner
              entityType={"connector"}
              entityName={connectorName}
              hasOpenClaimRequest={
                connectorData?.connectorInfo.hasOpenClaimRequest
              }
              entityOwner={connectorData.connectorInfo.teamName}
              hasOpenRequestOnAnyEnv={
                connectorData?.connectorInfo.hasOpenRequestOnAnyEnv
              }
              claimEntity={() => setShowClaimModal(true)}
              isError={isErrorCreateClaimConnectorRequest}
              errorMessage={claimErrorMessage}
            />
          </Box>
        )}

      <ConnectorOverviewResourcesTabs
        connectorName={connectorName}
        isError={connectorIsError}
        error={connectorError}
        isLoading={connectorIsLoading}
        currentTab={currentTab}
        environmentId={selectedEnvironmentId}
        connectorOverview={connectorData}
        connectorIsRefetching={connectorIsRefetching}
      />
    </>
  );
}

function useConnectorDetails() {
  return useOutletContext<{
    environmentId: string;
    connectorOverview: ConnectorOverview;
    connectorIsRefetching: boolean;
  }>();
}

export { ConnectorDetails, useConnectorDetails };
