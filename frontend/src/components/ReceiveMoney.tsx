import { Box } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { usePrivyWagmi } from "@privy-io/wagmi-connector";
import { useBalance, useNetwork, useSwitchNetwork, useTransaction } from "wagmi";
import { keccak256, encodeAbiParameters, parseAbiParameters, parseUnits, formatUnits, formatEther } from "viem";
import { useContractRead, usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import eTransferAbi from "../abi/etransfer.js";
import tokenAbi from "../abi/token.js";
import { nanoid } from "nanoid";
import db from "../firebase.ts";
import { ref, update, set, onValue, get } from "firebase/database";
import { hashEmail, toFixedIfNecessary, numberWithCommas } from "../helperFunctions.ts";
import {
  Button,
  Input,
  Heading,
  InputGroup,
  useToast,
  InputLeftElement,
  InputRightElement,
  Container,
  Center,
  UnorderedList,
  Divider,
  Spinner,
  ListItem,
  NumberInput,
  NumberInputField,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  HStack,
  VStack,
  Grid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
  Flex,
  Text,
  Spacer,
  Breadcrumb,
} from "@chakra-ui/react";
import { getRedirectResult } from "firebase/auth";
import { isCastable } from "../helperFunctions.ts";

const ETRANSFER_ADDRESS = "0xB2D2f29e572577854306099DFA24B07596eC92a7";
const TOKEN_ADDRESS = "0x62e6940856c42bD23C0c895824921678A37A62aE";

type TransferWithId = {
  from: `0x${string}`;
  to: `0x${string}`;
  refundAddress: `0x${string}`;
  amount: bigint;
  id: string;
  index: bigint;
};

type Contact = {
  email: string;
  name: string;
};
function ReceiveMoney() {
  const toast = useToast();
  const { wallet: activeWallet, setActiveWallet } = usePrivyWagmi();
  const { data: pendingTransfers, isLoading: arePendingTransfersLoading } = useContractRead({
    address: ETRANSFER_ADDRESS,
    abi: eTransferAbi,
    functionName: "getPendingTransfers",
    watch: true,
  });
  const {
    write: receiveTransfer,
    data: receiveTransferData,
    isLoading: isReceiveTransferLoading,
  } = useContractWrite({ address: ETRANSFER_ADDRESS, abi: eTransferAbi, functionName: "receiveTransfer" });
  const { isLoading: isReceiveTransferWaitingForConf } = useWaitForTransaction({
    hash: receiveTransferData?.hash,
    onSuccess(data) {
      toast({
        title: "Transaction success.",
        status: "success",
        isClosable: true,
        duration: 6000,
      });
    },
    onError(error) {
      toast({
        title: "Transaction error.",
        description: error.message,
        status: "error",
        isClosable: true,
        duration: 6000,
      });
    },
  });
  const { data: linkedEmail, isLoading: isLinkedEmailLoading } = useContractRead({
    address: ETRANSFER_ADDRESS,
    abi: eTransferAbi,
    functionName: "linkedEmail",
    args: [activeWallet?.address as `0x${string}`],
    enabled: typeof activeWallet !== "undefined",
  });
  const receivedTransfers: TransferWithId[] = [];
  const myPendingTransfers: TransferWithId[] = [];
  if (pendingTransfers) {
    pendingTransfers.forEach((transfer, index) => {
      if (transfer.from === linkedEmail) {
        myPendingTransfers.push({ id: nanoid(), index: BigInt(index), ...transfer });
      }
      if (transfer.to === linkedEmail) {
        receivedTransfers.push({ id: nanoid(), index: BigInt(index), ...transfer });
      }
    });
  }
  return (
    <Flex direction={"column"}>
      {receivedTransfers.map((transfer) => {
        return (
          <Card>
            <CardHeader>
              <Text>Transfer</Text>
            </CardHeader>
            <CardBody>
              <Text>`${formatEther(transfer.amount)}</Text>
            </CardBody>
            <CardFooter>
              <Button
                isLoading={isReceiveTransferWaitingForConf || isReceiveTransferLoading}
                bgColor={"brand"}
                onClick={() => receiveTransfer({ args: [transfer.index, activeWallet?.address as `0x${string}`] })}
              >
                Deposit
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </Flex>
  );
}

export default ReceiveMoney;
