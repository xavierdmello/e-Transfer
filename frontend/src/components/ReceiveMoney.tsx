import { Box } from "@chakra-ui/react";

function ReceiveMoney() {
  //   const { data: pendingTransfers, isLoading: arePendingTransfersLoading } = useContractRead({
  //     address: ETRANSFER_ADDRESS,
  //     abi: eTransferAbi,
  //     functionName: "getPendingTransfers",
  //     watch: true,
  //   });

  //   const receivedTransfers: TransferWithId[] = [];
  //   const myPendingTransfers: TransferWithId[] = [];
  //   if (pendingTransfers) {
  //     pendingTransfers.forEach((transfer, index) => {
  //       if (transfer.from === linkedEmail) {
  //         myPendingTransfers.push({ id: nanoid(), index: BigInt(index), ...transfer });
  //       }
  //       if (transfer.to === linkedEmail) {
  //         receivedTransfers.push({ id: nanoid(), index: BigInt(index), ...transfer });
  //       }
  //     });
  //   }
  return <Box>receiveMoney</Box>;
}

export default ReceiveMoney;